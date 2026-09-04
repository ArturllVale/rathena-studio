import { ItemPackageEditSession } from '../../domain/database/workspace/itemPackageEditSession';
import { ItemPackageDatabaseValidator } from './itemPackage/itemPackageDatabaseValidator';
import { ItemPackageDatabaseSerializer } from './itemPackage/itemPackageDatabaseSerializer';
import { FileContentWriter } from '../../domain/database/workspace/fileContentWriter';
import { ItemPackageDatabaseProvider } from './providers/itemPackageDatabaseProvider';
import { EffectiveItemPackage } from '../../domain/database/itemPackage/effectiveItemPackage';
import { ItemPackageRawFields } from '../../domain/database/itemPackage/itemPackageTypes';
import { ValidationIssue } from './itemDatabaseValidator';
import { AppError } from '../../lib/error';

export class ItemPackageEditTransactionService {
  constructor(
    private validator: ItemPackageDatabaseValidator,
    private serializer: ItemPackageDatabaseSerializer,
    private writer: FileContentWriter
  ) {}

  public validateSession(session: ItemPackageEditSession): ValidationIssue[] {
    const tempEffective: EffectiveItemPackage = {
      ...session.originalPackage,
      fields: session.getEffectiveFields(),
    };
    return this.validator.validateEffectivePackage(tempEffective);
  }

  public async commitSession(
    session: ItemPackageEditSession,
    provider: ItemPackageDatabaseProvider
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
    const { fieldOrigins, layerProvenance } = session.originalPackage;

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
      const layerData = repo.getLayer(layerId);
      if (!layerData) {
        throw new AppError({
          code: 'ERR_LAYER_NOT_FOUND',
          message: `Target layer ${layerId} not found in repository`,
          severity: 'error',
        });
      }

      let nodeIndex = this.serializer.findPackageNodeIndex(layerData, session.packageName);

      if (nodeIndex === -1) {
        nodeIndex = this.serializer.addPackage(layerData.adapter, session.getEffectiveFields());
        if (nodeIndex === -1) {
          throw new AppError({
            code: 'ERR_AST_MUTATION',
            message: `Failed to create item package node in layer ${layerId}`,
            severity: 'error',
          });
        }
      } else {
        for (const mut of mutations) {
          if (mut.value === undefined) {
            this.serializer.removePackageField(layerData.adapter, nodeIndex, mut.field);
          } else {
            this.serializer.updatePackageField(layerData.adapter, nodeIndex, mut.field, mut.value);
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

  public async createPackage(
    pkg: ItemPackageRawFields,
    targetLayerId: string,
    provider: ItemPackageDatabaseProvider
  ): Promise<void> {
    const repo = provider.getRepository();
    if (!repo) {
      throw new AppError({ code: 'ERR_NO_REPO', message: 'Repository not available', severity: 'error' });
    }

    const pkgName = pkg.Package || pkg.Item || '';
    if (!pkgName) {
      throw new AppError({
        code: 'ERR_INVALID_PACKAGE_NAME',
        message: 'Package or Item identifier cannot be empty.',
        severity: 'error',
      });
    }

    if (repo.findByPackage(pkgName)) {
      throw new AppError({
        code: 'ERR_DUPLICATE_PACKAGE',
        message: `Package "${pkgName}" already exists in the database.`,
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

    this.serializer.addPackage(layerData.adapter, pkg);
    const newYaml = this.serializer.serialize(layerData, repo.getVariant());
    await this.writer.writeFile(layerData.layer.relativePath, newYaml);
    await provider.reloadLayer(targetLayerId);
  }
}
