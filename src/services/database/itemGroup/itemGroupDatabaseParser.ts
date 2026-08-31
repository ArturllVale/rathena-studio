import { DatabaseLayer } from '../../../domain/database/common/databaseLayer';
import {
  ItemGroupDatabaseFile,
  ItemGroupDatabaseHeader,
} from '../../../domain/database/itemGroup/itemGroupDatabase';
import {
  ItemGroupRawFields,
  getItemGroupAllEntries,
} from '../../../domain/database/itemGroup/itemGroupTypes';
import {
  createSourceItemGroup,
  SourceItemGroup,
} from '../../../domain/database/itemGroup/sourceItemGroup';
import { ItemDatabaseFooterImport } from '../../../domain/database/item/itemDatabase';
import { ParseDiagnostic } from '../itemDatabaseParser';
import { YamlDocumentAdapter } from '../yamlDocumentAdapter';

export interface ItemGroupDatabaseParseResult {
  readonly file?: ItemGroupDatabaseFile;
  readonly adapter: YamlDocumentAdapter;
  readonly diagnostics: readonly ParseDiagnostic[];
  readonly isValid: boolean;
}

const KNOWN_GROUP_FIELD_KEYS = new Set<keyof ItemGroupRawFields>(['Group', 'SubGroup', 'SubGroups', 'List']);

export class ItemGroupDatabaseParser {
  public parse(rawYaml: string, layer: DatabaseLayer): ItemGroupDatabaseParseResult {
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
        message: 'No database "Header" was found in item group database file.',
      });
      return { adapter, diagnostics, isValid: false };
    }

    const headerType = String(rawHeader.Type || '');
    if (headerType !== 'ITEM_GROUP_DB') {
      diagnostics.push({
        severity: 'error',
        message: `Database type mismatch: expected "ITEM_GROUP_DB", found "${headerType}".`,
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

    const header: ItemGroupDatabaseHeader = {
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

    const groups: SourceItemGroup[] = [];
    const rawBody = jsData.Body;

    if (Array.isArray(rawBody)) {
      for (let i = 0; i < rawBody.length; i++) {
        const rawGroup = rawBody[i];
        if (!rawGroup || typeof rawGroup !== 'object') {
          diagnostics.push({
            severity: 'warning',
            message: `Body entry at index ${i} is not a valid object, skipping.`,
          });
          continue;
        }

        const groupName = rawGroup.Group;
        if (!groupName || typeof groupName !== 'string') {
          diagnostics.push({
            severity: 'warning',
            message: `Item Group entry at index ${i} is missing "Group" identifier, skipping.`,
          });
          continue;
        }

        const presentKeys = new Set<keyof ItemGroupRawFields>();
        const fields: Partial<ItemGroupRawFields> = {};
        const unknownFields: Record<string, unknown> = {};

        for (const [key, value] of Object.entries(rawGroup)) {
          if (KNOWN_GROUP_FIELD_KEYS.has(key as keyof ItemGroupRawFields)) {
            const typedKey = key as keyof ItemGroupRawFields;
            presentKeys.add(typedKey);
            (fields as Record<string, unknown>)[typedKey] = value;
          } else {
            unknownFields[key] = value;
          }
        }

        if (!fields.List && fields.SubGroups) {
          fields.List = getItemGroupAllEntries(fields);
        }

        const ranges = adapter.getItemRanges(i);

        const sourceGroup = createSourceItemGroup({
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

        groups.push(sourceGroup);
      }
    }

    const file: ItemGroupDatabaseFile = {
      layer,
      header,
      imports,
      groups,
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
