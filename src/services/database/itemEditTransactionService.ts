import { ItemEditSession } from '../../domain/database/workspace/itemEditSession';
import { ItemDatabaseValidator, ValidationIssue } from './itemDatabaseValidator';
import { ItemDatabaseSerializer } from './itemDatabaseSerializer';
import { FileContentWriter } from '../../domain/database/workspace/fileContentWriter';
import { ItemDatabaseProvider } from './providers/itemDatabaseProvider';
import { EffectiveItem } from '../../domain/database/item/effectiveItem';
import { ItemRawFields } from '../../domain/database/item/itemTypes';
import { AppError } from '../../lib/error';

export class ItemEditTransactionService {
  constructor(
    private validator: ItemDatabaseValidator,
    private serializer: ItemDatabaseSerializer,
    private writer: FileContentWriter
  ) {}

  public validateSession(session: ItemEditSession): ValidationIssue[] {
    const tempEffective: EffectiveItem = {
      ...session.originalItem,
      fields: session.getEffectiveFields(),
    };
    return this.validator.validateEffectiveItem(tempEffective);
  }

  public async commitSession(
    session: ItemEditSession,
    provider: ItemDatabaseProvider
  ): Promise<void> {
    if (!session.isDirty) {
      return;
    }

    const issues = this.validateSession(session);
    const errors = issues.filter((i) => i.severity === 'error');
    if (errors.length > 0) {
      throw new AppError({ code: 'ERR_VALIDATION', message: `Validation failed: ${errors.map((e) => e.message).join(', ')}`, severity: 'error' });
    }

    const repo = provider.getRepository();
    if (!repo) {
      throw new AppError({ code: 'ERR_NO_REPO', message: 'Repository not available', severity: 'error' });
    }

    const pendingChanges = session.getPendingChanges();
    const { fieldOrigins, layerProvenance } = session.originalItem;
    
    const importLayerId = 'item-db-import';
    const fallbackLayerId = layerProvenance[layerProvenance.length - 1];
    const hasImportLayer = !!repo.getLayer(importLayerId);
    
    const layerMutations = new Map<string, Array<{ field: string, value: unknown }>>();

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
        throw new AppError({ code: 'ERR_LAYER_NOT_FOUND', message: `Target layer ${layerId} not found in repository`, severity: 'error' });
      }

      let nodeIndex = this.serializer.findItemNodeIndex(layerData, session.itemId);
      
      if (nodeIndex === -1) {
        nodeIndex = this.serializer.addItem(layerData.adapter, { Id: session.itemId });
        if (nodeIndex === -1) {
          throw new AppError({ code: 'ERR_AST_MUTATION', message: `Failed to create item node in layer ${layerId}`, severity: 'error' });
        }
      }

      for (const mut of mutations) {
        if (mut.value === undefined) {
          this.serializer.removeItemField(layerData.adapter, nodeIndex, mut.field);
        } else {
          this.serializer.updateItemField(layerData.adapter, nodeIndex, mut.field, mut.value);
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

  public async createItem(
    item: Partial<ItemRawFields> & { Id: number; AegisName: string },
    targetLayerId: string,
    provider: ItemDatabaseProvider
  ): Promise<void> {
    const repo = provider.getRepository();
    if (!repo) {
      throw new AppError({ code: 'ERR_NO_REPO', message: 'Repository not available', severity: 'error' });
    }

    if (repo.findById(item.Id)) {
      throw new AppError({
        code: 'ERR_DUPLICATE_ID',
        message: `Item ID ${item.Id} already exists in the database.`,
        severity: 'error',
      });
    }

    if (repo.findByAegisName(item.AegisName)) {
      throw new AppError({
        code: 'ERR_DUPLICATE_NAME',
        message: `Item AegisName "${item.AegisName}" already exists in the database.`,
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

    this.serializer.addItem(layerData.adapter, item);
    const newYaml = this.serializer.serialize(layerData, repo.getVariant());
    await this.writer.writeFile(layerData.layer.relativePath, newYaml);
    await provider.reloadLayer(targetLayerId);
  }
}
