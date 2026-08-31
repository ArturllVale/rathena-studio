import { DatabaseLayer } from '../../../domain/database/common/databaseLayer';
import {
  ItemPackageDatabaseFile,
  ItemPackageDatabaseHeader,
} from '../../../domain/database/itemPackage/itemPackageDatabase';
import {
  ItemPackageRawFields,
} from '../../../domain/database/itemPackage/itemPackageTypes';
import {
  createSourceItemPackage,
  SourceItemPackage,
} from '../../../domain/database/itemPackage/sourceItemPackage';
import { ItemDatabaseFooterImport } from '../../../domain/database/item/itemDatabase';
import { ParseDiagnostic } from '../itemDatabaseParser';
import { YamlDocumentAdapter } from '../yamlDocumentAdapter';

export interface ItemPackageDatabaseParseResult {
  readonly file?: ItemPackageDatabaseFile;
  readonly adapter: YamlDocumentAdapter;
  readonly diagnostics: readonly ParseDiagnostic[];
  readonly isValid: boolean;
}

const KNOWN_PACKAGE_FIELD_KEYS = new Set<keyof ItemPackageRawFields>(['Package', 'Item', 'RandomOptions', 'Groups']);

export class ItemPackageDatabaseParser {
  public parse(rawYaml: string, layer: DatabaseLayer): ItemPackageDatabaseParseResult {
    const diagnostics: ParseDiagnostic[] = [];
    const adapter = YamlDocumentAdapter.parse(rawYaml);

    for (const err of adapter.getErrors()) {
      diagnostics.push({
        severity: 'error',
        message: `YAML Syntax Error: ${err.message}`,
      });
    }

    if (diagnostics.some((d) => d.severity === 'error')) {
      return { adapter, diagnostics, isValid: false };
    }

    const jsData = adapter.toJS<Record<string, unknown>>() || {};

    const rawHeader = jsData.Header as Record<string, unknown> | undefined;
    if (!rawHeader || typeof rawHeader !== 'object') {
      diagnostics.push({
        severity: 'error',
        message: 'No database "Header" was found in item package database file.',
      });
      return { adapter, diagnostics, isValid: false };
    }

    const headerType = String(rawHeader.Type || '');
    if (headerType !== 'ITEM_PACKAGES' && headerType !== 'ITEM_PACKAGE_DB') {
      diagnostics.push({
        severity: 'error',
        message: `Database type mismatch: expected "ITEM_PACKAGES" or "ITEM_PACKAGE_DB", found "${headerType}".`,
      });
      return { adapter, diagnostics, isValid: false };
    }

    const headerVersion = Number(rawHeader.Version || 0);
    if (!headerVersion || isNaN(headerVersion)) {
      diagnostics.push({
        severity: 'error',
        message: 'Missing or invalid database "Version" in Header.',
      });
      return { adapter, diagnostics, isValid: false };
    }

    const header: ItemPackageDatabaseHeader = {
      type: headerType,
      version: headerVersion,
      clear: rawHeader.Clear === true,
    };

    const imports: ItemDatabaseFooterImport[] = [];
    const rawFooter = jsData.Footer as Record<string, unknown> | undefined;
    if (rawFooter && typeof rawFooter === 'object' && Array.isArray(rawFooter.Imports)) {
      for (const imp of rawFooter.Imports) {
        if (imp && typeof imp === 'object' && typeof imp.Path === 'string') {
          imports.push({
            path: imp.Path,
            mode: imp.Mode === 'Renewal' || imp.Mode === 'Prerenewal' ? imp.Mode : undefined,
            generator: imp.Generator === true ? true : undefined,
          });
        }
      }
    }

    const packages: SourceItemPackage[] = [];
    const rawBody = jsData.Body;

    if (Array.isArray(rawBody)) {
      for (let i = 0; i < rawBody.length; i++) {
        const rawPackage = rawBody[i];
        if (!rawPackage || typeof rawPackage !== 'object') {
          diagnostics.push({
            severity: 'warning',
            message: `Body entry at index ${i} is not a valid object, skipping.`,
          });
          continue;
        }

        const pkgName = (rawPackage.Package || rawPackage.Item) as string | undefined;
        if (!pkgName || typeof pkgName !== 'string') {
          diagnostics.push({
            severity: 'warning',
            message: `Item Package entry at index ${i} is missing "Package" / "Item" identifier, skipping.`,
          });
          continue;
        }

        const presentKeys = new Set<keyof ItemPackageRawFields>();
        const fields: Partial<ItemPackageRawFields> = {};
        const unknownFields: Record<string, unknown> = {};

        for (const [key, value] of Object.entries(rawPackage)) {
          if (KNOWN_PACKAGE_FIELD_KEYS.has(key as keyof ItemPackageRawFields)) {
            const typedKey = key as keyof ItemPackageRawFields;
            presentKeys.add(typedKey);
            (fields as Record<string, unknown>)[typedKey] = value;
          } else {
            unknownFields[key] = value;
          }
        }

        const ranges = adapter.getItemRanges(i);

        const sourcePkg = createSourceItemPackage({
          sourceLayerId: layer.id,
          sourceFilePath: layer.relativePath,
          databaseVariant: layer.variant,
          fields,
          presentKeys,
          unknownFields,
          nodeIndex: i,
          entityRange: ranges.entityRange,
          fieldRanges: ranges.fieldRanges,
        });

        packages.push(sourcePkg);
      }
    }

    const file: ItemPackageDatabaseFile = {
      layer,
      header,
      imports,
      packages,
      rawText: rawYaml,
    };

    return {
      file,
      adapter,
      diagnostics,
      isValid: !diagnostics.some((d) => d.severity === 'error'),
    };
  }
}
