import { MobEditSession } from '../../domain/database/workspace/mobEditSession';
import { MobDatabaseValidator } from './mobDatabaseValidator';
import { MobDatabaseSerializer } from './mob/mobDatabaseSerializer';
import { FileContentWriter } from '../../domain/database/workspace/fileContentWriter';
import { MobDatabaseProvider } from './providers/mobDatabaseProvider';
import { EffectiveMob } from '../../domain/database/mob/effectiveMob';
import { MobRawFields } from '../../domain/database/mob/mobTypes';
import { ValidationIssue } from './itemDatabaseValidator';
import { AppError } from '../../lib/error';

export class MobEditTransactionService {
  constructor(
    private validator: MobDatabaseValidator,
    private serializer: MobDatabaseSerializer,
    private writer: FileContentWriter
  ) {}

  public validateSession(session: MobEditSession): ValidationIssue[] {
    const tempEffective: EffectiveMob = {
      ...session.originalMob,
      fields: {
        ...session.originalMob.fields,
        ...session.getPendingChanges(),
      },
    };
    return this.validator.validateEffectiveMob(tempEffective);
  }

  public async commitSession(
    session: MobEditSession,
    provider: MobDatabaseProvider
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
      throw new AppError({
        code: 'ERR_NO_REPO',
        message: 'Monster Repository not available',
        severity: 'error',
      });
    }

    const pendingChanges = session.getPendingChanges();
    const { fieldOrigins, layerProvenance } = session.originalMob;

    const importLayerId = 'mob-db-import';
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
          message: `Target layer "${layerId}" not registered in repository.`,
          severity: 'error',
        });
      }

      let nodeIndex = this.serializer.findMobNodeIndex(layerData, session.mobId);

      // Create new monster node in layer if it doesn't exist (e.g. creating override in import layer)
      if (nodeIndex === -1) {
        nodeIndex = this.serializer.addMob(layerData.adapter, {
          Id: session.mobId,
          AegisName: session.originalMob.fields.AegisName,
        });
      }

      for (const mutation of mutations) {
        if (mutation.value === undefined) {
          this.serializer.removeMobField(layerData.adapter, nodeIndex, mutation.field);
        } else {
          this.serializer.updateMobField(layerData.adapter, nodeIndex, mutation.field, mutation.value);
        }
      }

      affectedLayers.add(layerId);
    }

    for (const layerId of affectedLayers) {
      const layerData = repo.getLayer(layerId)!;
      const yamlContent = layerData.adapter.toString();
      await this.writer.writeFile(layerData.layer.relativePath, yamlContent);
    }

    repo.invalidate();
    session.reset();
  }

  public async createMob(
    mob: Partial<MobRawFields> & { Id: number; AegisName: string },
    targetLayerId: string,
    provider: MobDatabaseProvider
  ): Promise<void> {
    const repo = provider.getRepository();
    if (!repo) {
      throw new AppError({
        code: 'ERR_NO_REPO',
        message: 'Monster Repository not available',
        severity: 'error',
      });
    }

    if (repo.findById(mob.Id)) {
      throw new AppError({
        code: 'ERR_DUPLICATE_ID',
        message: `Monster ID ${mob.Id} already exists in the database.`,
        severity: 'error',
      });
    }

    if (repo.findByAegisName(mob.AegisName)) {
      throw new AppError({
        code: 'ERR_DUPLICATE_NAME',
        message: `Monster AegisName "${mob.AegisName}" already exists in the database.`,
        severity: 'error',
      });
    }

    const layerData = repo.getLayer(targetLayerId);
    if (!layerData) {
      throw new AppError({
        code: 'ERR_LAYER_NOT_FOUND',
        message: `Target layer "${targetLayerId}" not registered in repository.`,
        severity: 'error',
      });
    }

    this.serializer.addMob(layerData.adapter, mob);
    const yamlContent = layerData.adapter.toString();
    await this.writer.writeFile(layerData.layer.relativePath, yamlContent);
    await provider.reloadLayer(targetLayerId);
    repo.invalidate();
  }
}
