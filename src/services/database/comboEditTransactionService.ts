import { ComboEditSession } from '../../domain/database/workspace/comboEditSession';
import { ComboDatabaseValidator } from './combo/comboDatabaseValidator';
import { ComboDatabaseSerializer } from './combo/comboDatabaseSerializer';
import { FileContentWriter } from '../../domain/database/workspace/fileContentWriter';
import { ComboDatabaseProvider } from './providers/comboDatabaseProvider';
import { EffectiveItemCombo } from '../../domain/database/combo/effectiveCombo';
import { ItemComboRawFields, normalizeComboKey } from '../../domain/database/combo/comboTypes';
import { ValidationIssue } from './itemDatabaseValidator';
import { AppError } from '../../lib/error';

export class ComboEditTransactionService {
  constructor(
    private validator: ComboDatabaseValidator,
    private serializer: ComboDatabaseSerializer,
    private writer: FileContentWriter
  ) {}

  public validateSession(session: ComboEditSession): ValidationIssue[] {
    const tempEffective: EffectiveItemCombo = {
      ...session.originalCombo,
      fields: session.getEffectiveFields(),
    };
    return this.validator.validateEffectiveCombo(tempEffective);
  }

  public async commitSession(
    session: ComboEditSession,
    provider: ComboDatabaseProvider
  ): Promise<void> {
    if (!session.isDirty) {
      return;
    }

    const issues = this.validateSession(session);
    const errors = issues.filter((i) => i.severity === 'error');
    if (errors.length > 0) {
      throw new AppError({
        code: 'ERR_VALIDATION',
        message: `Validation failed: ${errors.map((e) => e.message).join(', ')}`,
        severity: 'error',
      });
    }

    const repo = provider.getRepository();
    if (!repo) {
      throw new AppError({ code: 'ERR_NO_REPO', message: 'Repository not available', severity: 'error' });
    }

    const pendingChanges = session.getPendingChanges();
    const { fieldOrigins, layerProvenance } = session.originalCombo;

    const importLayerId = 'combo-db-import';
    const fallbackLayerId = layerProvenance[layerProvenance.length - 1];
    const hasImportLayer = !!repo.getLayer(importLayerId);

    const layerMutations = new Map<string, Array<{ field: string; value: unknown }>>();

    for (const [field, value] of Object.entries(pendingChanges)) {
      const origin = fieldOrigins[field];
      let targetLayerId: string;

      if (origin && origin.layerId === importLayerId) {
        targetLayerId = importLayerId;
      } else if (origin && origin.layerId === fallbackLayerId && fallbackLayerId === importLayerId) {
        targetLayerId = importLayerId;
      } else {
        targetLayerId = hasImportLayer ? importLayerId : fallbackLayerId;
      }

      if (!layerMutations.has(targetLayerId)) {
        layerMutations.set(targetLayerId, []);
      }
      layerMutations.get(targetLayerId)!.push({ field, value });
    }

    const affectedLayers = new Set<string>();

    for (const [layerId, mutations] of layerMutations.entries()) {
      const layerData = repo.getLayer(layerId);
      if (!layerData) {
        throw new AppError({
          code: 'ERR_LAYER_NOT_FOUND',
          message: `Target layer ${layerId} not found in repository`,
          severity: 'error',
        });
      }

      let nodeIndex = this.serializer.findComboNodeIndex(layerData, session.comboKey);

      if (nodeIndex === -1) {
        nodeIndex = this.serializer.addCombo(layerData.adapter, session.getEffectiveFields());
        if (nodeIndex === -1) {
          throw new AppError({
            code: 'ERR_AST_MUTATION',
            message: `Failed to create combo node in layer ${layerId}`,
            severity: 'error',
          });
        }
      } else {
        for (const mut of mutations) {
          if (mut.value === undefined) {
            this.serializer.removeComboField(layerData.adapter, nodeIndex, mut.field);
          } else {
            this.serializer.updateComboField(layerData.adapter, nodeIndex, mut.field, mut.value);
          }
        }
      }

      const newYaml = this.serializer.serialize(layerData, repo.getVariant());
      await this.writer.writeFile(layerData.layer.relativePath, newYaml);
      affectedLayers.add(layerId);
    }

    for (const layerId of affectedLayers) {
      await provider.reloadLayer(layerId);
    }
  }

  public async createCombo(
    combo: ItemComboRawFields,
    targetLayerId: string,
    provider: ComboDatabaseProvider
  ): Promise<void> {
    const repo = provider.getRepository();
    if (!repo) {
      throw new AppError({ code: 'ERR_NO_REPO', message: 'Repository not available', severity: 'error' });
    }

    const key = normalizeComboKey(combo.Combo);
    if (repo.findByKey(key)) {
      throw new AppError({
        code: 'ERR_DUPLICATE_COMBO',
        message: `Combo "${key}" already exists in the database.`,
        severity: 'error',
      });
    }

    const layerData = repo.getLayer(targetLayerId);
    if (!layerData) {
      throw new AppError({
        code: 'ERR_LAYER_NOT_FOUND',
        message: `Target layer "${targetLayerId}" not found in repository.`,
        severity: 'error',
      });
    }

    this.serializer.addCombo(layerData.adapter, combo);
    const newYaml = this.serializer.serialize(layerData, repo.getVariant());
    await this.writer.writeFile(layerData.layer.relativePath, newYaml);
    await provider.reloadLayer(targetLayerId);
  }
}
