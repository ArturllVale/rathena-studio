import { DatabaseLayer } from '../../../domain/database/common/databaseLayer';
import {
  ItemComboDatabaseFile,
  ItemComboDatabaseHeader,
} from '../../../domain/database/combo/comboDatabase';
import { ItemComboRawFields } from '../../../domain/database/combo/comboTypes';
import { createSourceItemCombo, SourceItemCombo } from '../../../domain/database/combo/sourceCombo';
import { ItemDatabaseFooterImport } from '../../../domain/database/item/itemDatabase';
import { ParseDiagnostic } from '../itemDatabaseParser';
import { YamlDocumentAdapter } from '../yamlDocumentAdapter';

export interface ComboDatabaseParseResult {
  readonly file?: ItemComboDatabaseFile;
  readonly adapter: YamlDocumentAdapter;
  readonly diagnostics: readonly ParseDiagnostic[];
  readonly isValid: boolean;
}

const KNOWN_COMBO_FIELD_KEYS = new Set<keyof ItemComboRawFields>(['Combo', 'Script']);

export class ComboDatabaseParser {
  public parse(rawYaml: string, layer: DatabaseLayer): ComboDatabaseParseResult {
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
        message: 'No database "Header" was found in item combos database file.',
      });
      return { adapter, diagnostics, isValid: false };
    }

    const headerType = String(rawHeader.Type || '');
    if (headerType !== 'ITEM_COMBOS_DB' && headerType !== 'COMBO_DB') {
      diagnostics.push({
        severity: 'error',
        message: `Database type mismatch: expected "ITEM_COMBOS_DB" or "COMBO_DB", found "${headerType}".`,
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

    const header: ItemComboDatabaseHeader = {
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

    const combos: SourceItemCombo[] = [];
    const rawBody = jsData.Body;

    if (Array.isArray(rawBody)) {
      for (let i = 0; i < rawBody.length; i++) {
        const rawCombo = rawBody[i];
        if (!rawCombo || typeof rawCombo !== 'object') {
          diagnostics.push({
            severity: 'warning',
            message: `Body entry at index ${i} is not a valid object, skipping.`,
          });
          continue;
        }

        const comboSets: (string | number)[][] = [];
        if (Array.isArray(rawCombo.Combo) && rawCombo.Combo.length > 0) {
          comboSets.push(rawCombo.Combo);
        } else if (Array.isArray(rawCombo.Combos)) {
          for (const item of rawCombo.Combos) {
            if (item && typeof item === 'object' && Array.isArray(item.Combo) && item.Combo.length > 0) {
              comboSets.push(item.Combo);
            }
          }
        }

        if (comboSets.length === 0) {
          diagnostics.push({
            severity: 'warning',
            message: `Combo entry at index ${i} has empty or missing "Combo" list, skipping.`,
          });
          continue;
        }

        for (const cSet of comboSets) {
          const presentKeys = new Set<keyof ItemComboRawFields>();
          const fields: Partial<ItemComboRawFields> = { Combo: cSet };
          const unknownFields: Record<string, unknown> = {};

          for (const [key, value] of Object.entries(rawCombo)) {
            if (key === 'Combos') continue;
            if (KNOWN_COMBO_FIELD_KEYS.has(key as keyof ItemComboRawFields)) {
              const typedKey = key as keyof ItemComboRawFields;
              presentKeys.add(typedKey);
              if (typedKey !== 'Combo') {
                (fields as Record<string, unknown>)[typedKey] = value;
              }
            } else {
              unknownFields[key] = value;
            }
          }
          presentKeys.add('Combo');

          const ranges = adapter.getItemRanges(i);

          const sourceCombo = createSourceItemCombo({
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

          combos.push(sourceCombo);
        }
      }
    }

    const file: ItemComboDatabaseFile = {
      layer,
      header,
      imports,
      combos,
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
