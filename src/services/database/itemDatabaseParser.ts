import { DatabaseLayer } from '../../domain/database/common/databaseLayer';
import {
  ItemDatabaseFile,
  ItemDatabaseFooterImport,
  ItemDatabaseHeader,
} from '../../domain/database/item/itemDatabase';
import { ItemRawFields } from '../../domain/database/item/itemTypes';
import { createSourceItem, SourceItem } from '../../domain/database/item/sourceItem';
import { YamlDocumentAdapter } from './yamlDocumentAdapter';

export interface ParseDiagnostic {
  readonly severity: 'error' | 'warning' | 'info';
  readonly message: string;
  readonly line?: number;
  readonly column?: number;
  readonly field?: string;
  readonly itemId?: number;
}

export interface ItemDatabaseParseResult {
  readonly file?: ItemDatabaseFile;
  readonly adapter: YamlDocumentAdapter;
  readonly diagnostics: readonly ParseDiagnostic[];
  readonly isValid: boolean;
}

const KNOWN_ITEM_FIELD_KEYS = new Set<keyof ItemRawFields>([
  'Id',
  'AegisName',
  'Name',
  'Type',
  'SubType',
  'Buy',
  'Sell',
  'Weight',
  'Attack',
  'MagicAttack',
  'Defense',
  'Range',
  'Slots',
  'Jobs',
  'Classes',
  'Gender',
  'Locations',
  'WeaponLevel',
  'ArmorLevel',
  'EquipLevelMin',
  'EquipLevelMax',
  'Refineable',
  'Gradable',
  'View',
  'AliasName',
  'Flags',
  'Delay',
  'Stack',
  'NoUse',
  'Trade',
  'Script',
  'EquipScript',
  'UnEquipScript',
]);

export class ItemDatabaseParser {
  public parse(rawYaml: string, layer: DatabaseLayer): ItemDatabaseParseResult {
    const diagnostics: ParseDiagnostic[] = [];
    const adapter = YamlDocumentAdapter.parse(rawYaml);

    // 1. Check YAML syntax errors
    for (const err of adapter.getErrors()) {
      diagnostics.push({
        severity: 'error',
        message: `YAML Syntax Error: ${err.message}`,
      });
    }

    if (diagnostics.some((d) => d.severity === 'error')) {
      return {
        adapter,
        diagnostics,
        isValid: false,
      };
    }

    const jsData = adapter.toJS<Record<string, unknown>>() || {};

    // 2. Validate Header
    const rawHeader = jsData.Header as Record<string, unknown> | undefined;
    if (!rawHeader || typeof rawHeader !== 'object') {
      diagnostics.push({
        severity: 'error',
        message: 'No database "Header" was found in item database file.',
      });
      return { adapter, diagnostics, isValid: false };
    }

    const headerType = String(rawHeader.Type || '');
    if (headerType !== 'ITEM_DB') {
      diagnostics.push({
        severity: 'error',
        message: `Database type mismatch: expected "ITEM_DB", found "${headerType}".`,
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

    if (headerVersion > 3) {
      diagnostics.push({
        severity: 'error',
        message: `Database version ${headerVersion} is not supported. Maximum version is 3.`,
      });
      return { adapter, diagnostics, isValid: false };
    } else if (headerVersion < 1) {
      diagnostics.push({
        severity: 'error',
        message: `Database version ${headerVersion} is not supported anymore. Minimum version is 1.`,
      });
      return { adapter, diagnostics, isValid: false };
    } else if (headerVersion < 3) {
      diagnostics.push({
        severity: 'warning',
        message: `Database version ${headerVersion} is outdated and should be updated. Current version is 3.`,
      });
    }

    const header: ItemDatabaseHeader = {
      type: headerType,
      version: headerVersion,
      clear: rawHeader.Clear === true,
    };

    // 3. Extract Footer Imports
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

    // 4. Extract Body Items
    const items: SourceItem[] = [];
    const rawBody = jsData.Body;

    if (Array.isArray(rawBody)) {
      for (let i = 0; i < rawBody.length; i++) {
        const rawItem = rawBody[i];
        if (!rawItem || typeof rawItem !== 'object') {
          diagnostics.push({
            severity: 'warning',
            message: `Body entry at index ${i} is not a valid object, skipping.`,
          });
          continue;
        }

        const id = Number(rawItem.Id);
        if (isNaN(id) || id <= 0) {
          diagnostics.push({
            severity: 'warning',
            message: `Item at index ${i} has missing or invalid "Id", skipping.`,
          });
          continue;
        }

        const presentKeys = new Set<keyof ItemRawFields>();
        const fields: Partial<ItemRawFields> = {};
        const unknownFields: Record<string, unknown> = {};

        for (const [key, value] of Object.entries(rawItem)) {
          if (KNOWN_ITEM_FIELD_KEYS.has(key as keyof ItemRawFields)) {
            const typedKey = key as keyof ItemRawFields;
            presentKeys.add(typedKey);
            (fields as Record<string, unknown>)[typedKey] = value;
          } else {
            unknownFields[key] = value;
          }
        }

        const ranges = adapter.getItemRanges(i);

        const sourceItem = createSourceItem({
          id,
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

        items.push(sourceItem);
      }
    }

    const file: ItemDatabaseFile = {
      layer,
      header,
      imports,
      items,
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
