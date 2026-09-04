import { RandomOptionEditSession, RandomOptionGroupEditSession } from '../../domain/database/workspace/randomOptEditSession';
import { RandomOptDatabaseValidator } from './randomOpt/randomOptDatabaseValidator';
import { RandomOptDatabaseSerializer } from './randomOpt/randomOptDatabaseSerializer';
import { FileContentWriter } from '../../domain/database/workspace/fileContentWriter';
import { RandomOptDatabaseProvider } from './providers/randomOptDatabaseProvider';
import { EffectiveRandomOption, EffectiveRandomOptionGroup } from '../../domain/database/randomOpt/effectiveRandomOpt';
import { RandomOptionRawFields, RandomOptionGroupRawFields } from '../../domain/database/randomOpt/randomOptTypes';
import { ValidationIssue } from './itemDatabaseValidator';
import { AppError } from '../../lib/error';

export class RandomOptEditTransactionService {
  constructor(
    private validator: RandomOptDatabaseValidator,
    private serializer: RandomOptDatabaseSerializer,
    private writer: FileContentWriter
  ) {}

  public validateOptionSession(session: RandomOptionEditSession): ValidationIssue[] {
    const tempEffective: EffectiveRandomOption = {
      ...session.originalOption,
      fields: session.getEffectiveFields(),
    };
    return this.validator.validateEffectiveOption(tempEffective);
  }

  public validateGroupSession(session: RandomOptionGroupEditSession): ValidationIssue[] {
    const tempEffective: EffectiveRandomOptionGroup = {
      ...session.originalGroup,
      fields: session.getEffectiveFields(),
    };
    return this.validator.validateEffectiveGroup(tempEffective);
  }

  public async commitOptionSession(
    session: RandomOptionEditSession,
    provider: RandomOptDatabaseProvider
  ): Promise<void> {
    if (!session.isDirty) return;

    const issues = this.validateOptionSession(session);
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
    const { fieldOrigins, layerProvenance } = session.originalOption;

    const fallbackLayerId = layerProvenance[0];
    
    const layerMutations = new Map<string, Array<{ field: string, value: unknown }>>();

    for (const [field, value] of Object.entries(pendingChanges)) {
      const origin = fieldOrigins[field];
      let targetLayerId: string;

      if (origin && origin.layerId) {
        targetLayerId = origin.layerId;
      } else {
        targetLayerId = fallbackLayerId;
      }

      if (!layerMutations.has(targetLayerId)) {
        layerMutations.set(targetLayerId, []);
      }
      layerMutations.get(targetLayerId)!.push({ field, value });
    }

    const affectedLayers = new Set<string>();

    for (const [layerId, mutations] of layerMutations.entries()) {
      const layerData = repo.getOptionLayer(layerId);
      if (!layerData) {
        throw new AppError({
          code: 'ERR_LAYER_NOT_FOUND',
          message: `Target layer ${layerId} not found in repository`,
          severity: 'error',
        });
      }

      let nodeIndex = this.serializer.findOptionNodeIndex(layerData, session.optionId);

      if (nodeIndex === -1) {
        nodeIndex = this.serializer.addOption(layerData.adapter, session.getEffectiveFields());
        if (nodeIndex === -1) {
          throw new AppError({
            code: 'ERR_AST_MUTATION',
            message: `Failed to create random option node in layer ${layerId}`,
            severity: 'error',
          });
        }
      } else {
        for (const mut of mutations) {
          if (mut.value === undefined) {
            this.serializer.removeOptionField(layerData.adapter, nodeIndex, mut.field);
          } else {
            this.serializer.updateOptionField(layerData.adapter, nodeIndex, mut.field, mut.value);
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

  public async createOption(
    option: RandomOptionRawFields,
    targetLayerId: string,
    provider: RandomOptDatabaseProvider
  ): Promise<void> {
    const repo = provider.getRepository();
    if (!repo) {
      throw new AppError({ code: 'ERR_NO_REPO', message: 'Repository not available', severity: 'error' });
    }

    if (repo.findOptionById(option.Id)) {
      throw new AppError({
        code: 'ERR_DUPLICATE_ID',
        message: `Random Option ID ${option.Id} already exists.`,
        severity: 'error',
      });
    }

    const layerData = repo.getOptionLayer(targetLayerId);
    if (!layerData) {
      throw new AppError({
        code: 'ERR_LAYER_NOT_FOUND',
        message: `Target layer "${targetLayerId}" not found in repository.`,
        severity: 'error',
      });
    }

    this.serializer.addOption(layerData.adapter, option);
    const newYaml = this.serializer.serialize(layerData, repo.getVariant());
    await this.writer.writeFile(layerData.layer.relativePath, newYaml);
    await provider.reloadLayer(targetLayerId);
  }

  public async createGroup(
    group: RandomOptionGroupRawFields,
    targetLayerId: string,
    provider: RandomOptDatabaseProvider
  ): Promise<void> {
    const repo = provider.getRepository();
    if (!repo) {
      throw new AppError({ code: 'ERR_NO_REPO', message: 'Repository not available', severity: 'error' });
    }

    if (repo.findGroupById(group.Id)) {
      throw new AppError({
        code: 'ERR_DUPLICATE_ID',
        message: `Random Option Group ID ${group.Id} already exists.`,
        severity: 'error',
      });
    }

    const layerData = repo.getGroupLayer(targetLayerId);
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
