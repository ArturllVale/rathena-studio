import { DatabaseLayer } from '../../../domain/database/common/databaseLayer';
import {
  MobDatabaseFile,
  MobDatabaseFooterImport,
  MobDatabaseHeader,
} from '../../../domain/database/mob/mobDatabase';
import { MobRawFields } from '../../../domain/database/mob/mobTypes';
import { createSourceMob, SourceMob } from '../../../domain/database/mob/sourceMob';
import { YamlDocumentAdapter } from '../yamlDocumentAdapter';
import { ParseDiagnostic } from '../itemDatabaseParser';

export interface MobDatabaseParseResult {
  readonly file?: MobDatabaseFile;
  readonly adapter: YamlDocumentAdapter;
  readonly diagnostics: readonly ParseDiagnostic[];
  readonly isValid: boolean;
}

const KNOWN_MOB_FIELD_KEYS = new Set<keyof MobRawFields>([
  'Id',
  'AegisName',
  'Name',
  'JapaneseName',
  'Level',
  'Hp',
  'Sp',
  'BaseExp',
  'JobExp',
  'MvpExp',
  'Attack',
  'Attack2',
  'Defense',
  'MagicDefense',
  'Resistance',
  'MagicResistance',
  'Str',
  'Agi',
  'Vit',
  'Int',
  'Dex',
  'Luk',
  'AttackRange',
  'SkillRange',
  'ChaseRange',
  'Size',
  'Race',
  'RaceGroups',
  'Element',
  'ElementLevel',
  'WalkSpeed',
  'AttackDelay',
  'AttackMotion',
  'DamageMotion',
  'DamageTaken',
  'Ai',
  'Class',
  'Modes',
  'MvpDrops',
  'Drops',
]);

export class MobDatabaseParser {
  public parse(rawYaml: string, layer: DatabaseLayer): MobDatabaseParseResult {
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
        message: 'Missing or invalid "Header" block in Monster Database file.',
      });
      return {
        adapter,
        diagnostics,
        isValid: false,
      };
    }

    if (rawHeader.Type !== 'MOB_DB') {
      diagnostics.push({
        severity: 'error',
        message: `Invalid Header.Type: expected "MOB_DB", got "${rawHeader.Type}"`,
      });
    }

    const header: MobDatabaseHeader = {
      type: 'MOB_DB',
      version: Number(rawHeader.Version) || 1,
    };

    // 3. Process Body
    const rawBody = jsData.Body;
    const mobs = new Map<number, SourceMob>();

    if (Array.isArray(rawBody)) {
      for (let idx = 0; idx < rawBody.length; idx++) {
        const mobRaw = rawBody[idx];
        if (!mobRaw || typeof mobRaw !== 'object') continue;

        const rawId = (mobRaw as Record<string, unknown>).Id;
        if (typeof rawId !== 'number' && typeof rawId !== 'string') {
          diagnostics.push({
            severity: 'error',
            message: `Monster at index ${idx} is missing a valid "Id" field.`,
          });
          continue;
        }

        const id = Number(rawId);
        if (isNaN(id) || id <= 0) {
          diagnostics.push({
            severity: 'error',
            message: `Monster at index ${idx} has invalid ID "${rawId}". Must be positive integer.`,
          });
          continue;
        }

        if (mobs.has(id)) {
          diagnostics.push({
            severity: 'warning',
            message: `Duplicate Monster ID ${id} in file "${layer.relativePath}". Overwriting previous definition.`,
            itemId: id,
          });
        }

        const fields: Partial<MobRawFields> = {};
        const presentKeys = new Set<keyof MobRawFields>();
        const unknownFields: Record<string, unknown> = {};

        for (const [key, val] of Object.entries(mobRaw as Record<string, unknown>)) {
          if (KNOWN_MOB_FIELD_KEYS.has(key as keyof MobRawFields)) {
            const fieldKey = key as keyof MobRawFields;
            (fields as Record<string, unknown>)[fieldKey] = val;
            presentKeys.add(fieldKey);
          } else {
            unknownFields[key] = val;
            diagnostics.push({
              severity: 'info',
              message: `Unknown monster field "${key}" on Monster ID ${id}. Preserving as raw AST node.`,
              itemId: id,
              field: key,
            });
          }
        }

        fields.Id = id;
        presentKeys.add('Id');

        const sourceMob = createSourceMob({
          id,
          sourceLayerId: layer.id,
          sourceFilePath: layer.relativePath,
          databaseVariant: layer.variant,
          fields,
          presentKeys,
          unknownFields,
          nodeIndex: idx,
        });

        mobs.set(id, sourceMob);
      }
    }

    // 4. Process Footer
    let footerImports: MobDatabaseFooterImport[] | undefined;
    const rawFooter = jsData.Footer as Record<string, unknown> | undefined;
    if (rawFooter && Array.isArray(rawFooter.Imports)) {
      footerImports = (rawFooter.Imports as Array<Record<string, unknown>>)
        .map((imp) => ({
          path: String(imp.Path || ''),
          mode: imp.Mode ? String(imp.Mode) : undefined,
        }))
        .filter((imp) => Boolean(imp.path));
    }

    const file: MobDatabaseFile = {
      header,
      mobs,
      footer: footerImports ? { imports: footerImports } : undefined,
    };

    const hasFatalErrors = diagnostics.some((d) => d.severity === 'error');

    return {
      file: hasFatalErrors ? undefined : file,
      adapter,
      diagnostics,
      isValid: !hasFatalErrors,
    };
  }
}
