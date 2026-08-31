import { ItemGroupEditSession } from '../../domain/database/workspace/itemGroupEditSession';
import { ItemGroupDatabaseValidator } from './itemGroup/itemGroupDatabaseValidator';
import { ItemGroupDatabaseSerializer } from './itemGroup/itemGroupDatabaseSerializer';
import { FileContentWriter } from '../../domain/database/workspace/fileContentWriter';
import { ItemGroupDatabaseProvider } from './providers/itemGroupDatabaseProvider';
import { EffectiveItemGroup } from '../../domain/database/itemGroup/effectiveItemGroup';
import { ItemGroupRawFields, normalizeItemGroupKey } from '../../domain/database/itemGroup/itemGroupTypes';
import { ValidationIssue } from './itemDatabaseValidator';
import { AppError } from '../../lib/error';

export class ItemGroupEditTransactionService {
  constructor(
    private validator: ItemGroupDatabaseValidator,
    private serializer: ItemGroupDatabaseSerializer,
    private writer: FileContentWriter
  ) {}

  public validateSession(session: ItemGroupEditSession): ValidationIssue[] {
    const tempEffective: EffectiveItemGroup = {
      ...session.originalGroup,
      fields: session.getEffectiveFields(),
    };
    return this.validator.validateEffectiveGroup(tempEffective);
  }

  public async commitSession(
    session: ItemGroupEditSession,
    provider: ItemGroupDatabaseProvider
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
    const { fieldOrigins, layerProvenance } = session.originalGroup;

    const importLayerId = 'item-group-db-import';
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

      let nodeIndex = this.serializer.findGroupNodeIndex(layerData, session.groupKey);

      if (nodeIndex === -1) {
        nodeIndex = this.serializer.addGroup(layerData.adapter, session.getEffectiveFields());
        if (nodeIndex === -1) {
          throw new AppError({
            code: 'ERR_AST_MUTATION',
            message: `Failed to create item group node in layer ${layerId}`,
            severity: 'error',
          });
        }
      } else {
        for (const mut of mutations) {
          if (mut.value === undefined) {
            this.serializer.removeGroupField(layerData.adapter, nodeIndex, mut.field);
          } else {
            this.serializer.updateGroupField(layerData.adapter, nodeIndex, mut.field, mut.value);
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

  public async createGroup(
    group: ItemGroupRawFields,
    targetLayerId: string,
    provider: ItemGroupDatabaseProvider
  ): Promise<void> {
    const repo = provider.getRepository();
    if (!repo) {
      throw new AppError({ code: 'ERR_NO_REPO', message: 'Repository not available', severity: 'error' });
    }

    const key = normalizeItemGroupKey(group.Group, group.SubGroup);
    if (repo.findByKey(key)) {
      throw new AppError({
        code: 'ERR_DUPLICATE_GROUP',
        message: `Group "${key}" already exists in the database.`,
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

    this.serializer.addGroup(layerData.adapter, group);
    const newYaml = this.serializer.serialize(layerData, repo.getVariant());
    await this.writer.writeFile(layerData.layer.relativePath, newYaml);
    await provider.reloadLayer(targetLayerId);
  }
}
