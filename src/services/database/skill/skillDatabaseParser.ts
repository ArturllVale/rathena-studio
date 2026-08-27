import { DatabaseLayer } from '../../../domain/database/common/databaseLayer';
import {
  SkillDatabaseFile,
  SkillDatabaseFooterImport,
  SkillDatabaseHeader,
} from '../../../domain/database/skill/skillDatabase';
import { SkillRawFields } from '../../../domain/database/skill/skillTypes';
import { createSourceSkill, SourceSkill } from '../../../domain/database/skill/sourceSkill';
import { YamlDocumentAdapter } from '../yamlDocumentAdapter';
import { ParseDiagnostic } from '../itemDatabaseParser';

export interface SkillDatabaseParseResult {
  readonly file?: SkillDatabaseFile;
  readonly adapter: YamlDocumentAdapter;
  readonly diagnostics: readonly ParseDiagnostic[];
  readonly isValid: boolean;
}

const KNOWN_SKILL_FIELD_KEYS = new Set<keyof SkillRawFields>([
  'Id',
  'Name',
  'Description',
  'MaxLevel',
  'Type',
  'TargetType',
  'DamageFlags',
  'Flags',
  'Range',
  'Hit',
  'HitCount',
  'Element',
  'SplashArea',
  'ActiveInstance',
  'Knockback',
  'GiveAp',
  'CopyFlags',
  'NoNearNPC',
  'CastCancel',
  'CastDefenseReduction',
  'CastTime',
  'AfterCastActDelay',
  'AfterCastWalkDelay',
  'Duration1',
  'Duration2',
  'Cooldown',
  'FixedCastTime',
  'CastTimeFlags',
  'CastDelayFlags',
  'Requires',
  'Unit',
  'Status',
]);

export class SkillDatabaseParser {
  public parse(rawYaml: string, layer: DatabaseLayer): SkillDatabaseParseResult {
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
        message: 'Missing or invalid "Header" block in Skill Database file.',
      });
      return {
        adapter,
        diagnostics,
        isValid: false,
      };
    }

    if (rawHeader.Type !== 'SKILL_DB') {
      diagnostics.push({
        severity: 'error',
        message: `Invalid Header.Type: expected "SKILL_DB", got "${rawHeader.Type}"`,
      });
    }

    const header: SkillDatabaseHeader = {
      type: 'SKILL_DB',
      version: Number(rawHeader.Version) || 1,
    };

    // 3. Process Body
    const rawBody = jsData.Body;
    const skills = new Map<number, SourceSkill>();

    if (Array.isArray(rawBody)) {
      for (let idx = 0; idx < rawBody.length; idx++) {
        const skillRaw = rawBody[idx];
        if (!skillRaw || typeof skillRaw !== 'object') continue;

        const rawId = (skillRaw as Record<string, unknown>).Id;
        if (typeof rawId !== 'number' && typeof rawId !== 'string') {
          diagnostics.push({
            severity: 'error',
            message: `Skill at index ${idx} is missing a valid "Id" field.`,
          });
          continue;
        }

        const id = Number(rawId);
        if (isNaN(id) || id <= 0) {
          diagnostics.push({
            severity: 'error',
            message: `Skill at index ${idx} has invalid ID "${rawId}". Must be positive integer.`,
          });
          continue;
        }

        const name = String((skillRaw as Record<string, unknown>).Name || `SKILL_${id}`);

        if (skills.has(id)) {
          diagnostics.push({
            severity: 'warning',
            message: `Duplicate Skill ID ${id} in file "${layer.relativePath}". Overwriting previous definition.`,
            itemId: id,
          });
        }

        const fields: Partial<SkillRawFields> = {};
        const presentKeys = new Set<keyof SkillRawFields>();
        const unknownFields: Record<string, unknown> = {};

        for (const [key, val] of Object.entries(skillRaw as Record<string, unknown>)) {
          if (KNOWN_SKILL_FIELD_KEYS.has(key as keyof SkillRawFields)) {
            const fieldKey = key as keyof SkillRawFields;
            (fields as Record<string, unknown>)[fieldKey] = val;
            presentKeys.add(fieldKey);
          } else {
            unknownFields[key] = val;
            diagnostics.push({
              severity: 'info',
              message: `Unknown skill field "${key}" on Skill ID ${id}. Preserving as raw AST node.`,
              itemId: id,
              field: key,
            });
          }
        }

        fields.Id = id;
        fields.Name = name;
        presentKeys.add('Id');
        presentKeys.add('Name');

        const sourceSkill = createSourceSkill({
          id,
          name,
          sourceLayerId: layer.id,
          sourceFilePath: layer.relativePath,
          databaseVariant: layer.variant,
          fields,
          presentKeys,
          unknownFields,
          nodeIndex: idx,
        });

        skills.set(id, sourceSkill);
      }
    }

    // 4. Process Footer
    let footerImports: SkillDatabaseFooterImport[] | undefined;
    const rawFooter = jsData.Footer as Record<string, unknown> | undefined;
    if (rawFooter && Array.isArray(rawFooter.Imports)) {
      footerImports = (rawFooter.Imports as Array<Record<string, unknown>>)
        .map((imp) => ({
          path: String(imp.Path || ''),
          mode: imp.Mode ? String(imp.Mode) : undefined,
        }))
        .filter((imp) => Boolean(imp.path));
    }

    const file: SkillDatabaseFile = {
      header,
      skills,
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
