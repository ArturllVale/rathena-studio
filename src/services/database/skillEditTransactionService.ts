import { SkillEditSession } from '../../domain/database/workspace/skillEditSession';
import { SkillDatabaseValidator } from './skillDatabaseValidator';
import { SkillDatabaseSerializer } from './skill/skillDatabaseSerializer';
import { FileContentWriter } from '../../domain/database/workspace/fileContentWriter';
import { SkillDatabaseProvider } from './providers/skillDatabaseProvider';
import { EffectiveSkill } from '../../domain/database/skill/effectiveSkill';
import { ValidationIssue } from './itemDatabaseValidator';
import { AppError } from '../../lib/error';

export class SkillEditTransactionService {
  constructor(
    private validator: SkillDatabaseValidator,
    private serializer: SkillDatabaseSerializer,
    private writer: FileContentWriter
  ) {}

  public validateSession(session: SkillEditSession): ValidationIssue[] {
    const tempEffective: EffectiveSkill = {
      ...session.originalSkill,
      fields: {
        ...session.originalSkill.fields,
        ...session.getPendingChanges(),
      },
    };
    return this.validator.validateEffectiveSkill(tempEffective);
  }

  public async commitSession(
    session: SkillEditSession,
    provider: SkillDatabaseProvider
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
        message: 'Skill Repository not available',
        severity: 'error',
      });
    }

    const pendingChanges = session.getPendingChanges();
    const { fieldOrigins, layerProvenance } = session.originalSkill;

    const importLayerId = 'skill-db-import';
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

      let nodeIndex = this.serializer.findSkillNodeIndex(layerData, session.skillId);

      // Create new skill node in layer if it doesn't exist (e.g. creating override in import layer)
      if (nodeIndex === -1) {
        nodeIndex = this.serializer.addSkill(layerData.adapter, {
          Id: session.skillId,
          Name: session.originalSkill.name,
        });
      }

      for (const mutation of mutations) {
        if (mutation.value === undefined) {
          this.serializer.removeSkillField(layerData.adapter, nodeIndex, mutation.field);
        } else {
          this.serializer.updateSkillField(layerData.adapter, nodeIndex, mutation.field, mutation.value);
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
}
