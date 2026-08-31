import { DatabaseLayer } from '../../../domain/database/common/databaseLayer';
import {
  RandomOptionDatabaseFile,
  RandomOptionGroupDatabaseFile,
  RandomOptionDatabaseHeader,
} from '../../../domain/database/randomOpt/randomOptDatabase';
import {
  RandomOptionRawFields,
  RandomOptionGroupRawFields,
} from '../../../domain/database/randomOpt/randomOptTypes';
import {
  createSourceRandomOption,
  createSourceRandomOptionGroup,
  SourceRandomOption,
  SourceRandomOptionGroup,
} from '../../../domain/database/randomOpt/sourceRandomOpt';
import { ItemDatabaseFooterImport } from '../../../domain/database/item/itemDatabase';
import { ParseDiagnostic } from '../itemDatabaseParser';
import { YamlDocumentAdapter } from '../yamlDocumentAdapter';

export interface RandomOptDatabaseParseResult {
  readonly optionFile?: RandomOptionDatabaseFile;
  readonly groupFile?: RandomOptionGroupDatabaseFile;
  readonly adapter: YamlDocumentAdapter;
  readonly diagnostics: readonly ParseDiagnostic[];
  readonly isValid: boolean;
}

const KNOWN_OPTION_FIELD_KEYS = new Set<keyof RandomOptionRawFields>(['Id', 'Option', 'Script']);
const KNOWN_GROUP_FIELD_KEYS = new Set<keyof RandomOptionGroupRawFields>(['Id', 'Group', 'MaxRandom', 'Slots']);

export class RandomOptDatabaseParser {
  public parse(rawYaml: string, layer: DatabaseLayer): RandomOptDatabaseParseResult {
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
        message: 'No database "Header" was found in random option database file.',
      });
      return { adapter, diagnostics, isValid: false };
    }

    const headerType = String(rawHeader.Type || '');
    if (headerType !== 'RANDOM_OPTION_DB' && headerType !== 'RANDOM_OPTION_GROUP') {
      diagnostics.push({
        severity: 'error',
        message: `Database type mismatch: expected "RANDOM_OPTION_DB" or "RANDOM_OPTION_GROUP", found "${headerType}".`,
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

    const header: RandomOptionDatabaseHeader = {
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

    const rawBody = jsData.Body;

    if (headerType === 'RANDOM_OPTION_DB') {
      const options: SourceRandomOption[] = [];
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
          const optionName = String(rawItem.Option || '');
          if (isNaN(id) || id <= 0) {
            diagnostics.push({
              severity: 'warning',
              message: `Random Option entry at index ${i} has missing or invalid "Id", skipping.`,
            });
            continue;
          }

          const presentKeys = new Set<keyof RandomOptionRawFields>();
          const fields: Partial<RandomOptionRawFields> = {};
          const unknownFields: Record<string, unknown> = {};

          for (const [key, value] of Object.entries(rawItem)) {
            if (KNOWN_OPTION_FIELD_KEYS.has(key as keyof RandomOptionRawFields)) {
              const typedKey = key as keyof RandomOptionRawFields;
              presentKeys.add(typedKey);
              (fields as Record<string, unknown>)[typedKey] = value;
            } else {
              unknownFields[key] = value;
            }
          }

          const ranges = adapter.getItemRanges(i);

          const sourceOption = createSourceRandomOption({
            id,
            option: optionName,
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

          options.push(sourceOption);
        }
      }

      const optionFile: RandomOptionDatabaseFile = {
        layer,
        header,
        imports,
        options,
        rawText: rawYaml,
      };

      return {
        optionFile,
        adapter,
        diagnostics,
        isValid: !diagnostics.some((d) => d.severity === 'error'),
      };
    } else {
      const groups: SourceRandomOptionGroup[] = [];
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

          const id = Number(rawGroup.Id);
          const groupName = String(rawGroup.Group || '');
          if (isNaN(id) || id <= 0) {
            diagnostics.push({
              severity: 'warning',
              message: `Random Option Group at index ${i} has missing or invalid "Id", skipping.`,
            });
            continue;
          }

          const presentKeys = new Set<keyof RandomOptionGroupRawFields>();
          const fields: Partial<RandomOptionGroupRawFields> = {};
          const unknownFields: Record<string, unknown> = {};

          for (const [key, value] of Object.entries(rawGroup)) {
            if (KNOWN_GROUP_FIELD_KEYS.has(key as keyof RandomOptionGroupRawFields)) {
              const typedKey = key as keyof RandomOptionGroupRawFields;
              presentKeys.add(typedKey);
              (fields as Record<string, unknown>)[typedKey] = value;
            } else {
              unknownFields[key] = value;
            }
          }

          const ranges = adapter.getItemRanges(i);

          const sourceGroup = createSourceRandomOptionGroup({
            id,
            group: groupName,
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

      const groupFile: RandomOptionGroupDatabaseFile = {
        layer,
        header,
        imports,
        groups,
        rawText: rawYaml,
      };

      return {
        groupFile,
        adapter,
        diagnostics,
        isValid: !diagnostics.some((d) => d.severity === 'error'),
      };
    }
  }
}
