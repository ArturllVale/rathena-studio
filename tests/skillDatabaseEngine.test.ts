import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { SkillDatabaseParser } from '../src/services/database/skill/skillDatabaseParser';
import { SkillDatabaseSerializer } from '../src/services/database/skill/skillDatabaseSerializer';
import { LayeredSkillRepository } from '../src/services/database/skill/layeredSkillRepository';
import { SkillDatabaseValidator } from '../src/services/database/skillDatabaseValidator';
import { SkillEditSession } from '../src/domain/database/workspace/skillEditSession';
import { DatabaseLayer } from '../src/domain/database/common/databaseLayer';
import { createEffectiveSkill } from '../src/domain/database/skill/effectiveSkill';

const HORIZON_DB_PATH = 'C:\\Users\\artur.vale\\OneDrive - SISTEMA FIEPA\\Documentos\\Pessoal\\github\\horizonro\\db';

describe('Skill Database Engine (SKILL_DB) Tests', () => {
  const parser = new SkillDatabaseParser();
  const serializer = new SkillDatabaseSerializer();
  const validator = new SkillDatabaseValidator();

  it('parses real rAthena pre-re skill_db.yml without errors', () => {
    const filePath = path.join(HORIZON_DB_PATH, 'pre-re', 'skill_db.yml');
    if (!fs.existsSync(filePath)) {
      console.warn('Skipping test: horizonro/db not found locally');
      return;
    }

    const rawYaml = fs.readFileSync(filePath, 'utf-8');
    const layer: DatabaseLayer = {
      id: 'skill-db-prere',
      name: 'Skill DB Pre-RE',
      relativePath: 'db/pre-re/skill_db.yml',
      variant: 'PRE_RE',
      priority: 200,
      type: 'MODE_SPECIFIC',
    };

    const result = parser.parse(rawYaml, layer);
    expect(result.isValid).toBe(true);
    expect(result.file).toBeDefined();
    expect(result.file!.skills.size).toBeGreaterThan(500);

    // Verify bash skill (Id 5)
    const bash = result.file!.skills.get(5);
    expect(bash).toBeDefined();
    expect(bash!.name).toBe('SM_BASH');
    expect(bash!.fields.Type).toBe('Weapon');
    expect(bash!.fields.TargetType).toBe('Attack');
    expect(bash!.fields.Requires?.SpCost).toBeDefined();
  });

  it('parses real rAthena renewal skill_db.yml without errors', () => {
    const filePath = path.join(HORIZON_DB_PATH, 're', 'skill_db.yml');
    if (!fs.existsSync(filePath)) {
      console.warn('Skipping test: horizonro/db not found locally');
      return;
    }

    const rawYaml = fs.readFileSync(filePath, 'utf-8');
    const layer: DatabaseLayer = {
      id: 'skill-db-re',
      name: 'Skill DB Renewal',
      relativePath: 'db/re/skill_db.yml',
      variant: 'RE',
      priority: 200,
      type: 'MODE_SPECIFIC',
    };

    const result = parser.parse(rawYaml, layer);
    expect(result.isValid).toBe(true);
    expect(result.file).toBeDefined();
    expect(result.file!.skills.size).toBeGreaterThan(500);
  });

  it('resolves multi-layer inheritance with import overrides', () => {
    const baseYaml = `
Header:
  Type: SKILL_DB
  Version: 3
Body:
  - Id: 5
    Name: SM_BASH
    Description: Bash
    MaxLevel: 10
    Type: Weapon
    TargetType: Attack
    Range: -1
    Requires:
      SpCost: 10
      Weapon:
        1hSword: true
`;

    const importYaml = `
Header:
  Type: SKILL_DB
  Version: 3
Body:
  - Id: 5
    Name: SM_BASH
    Description: Custom Server Overpowered Bash
    MaxLevel: 15
    Requires:
      SpCost: 5
      Weapon:
        2hSword: true
`;

    const baseLayer: DatabaseLayer = {
      id: 'skill-db-base',
      name: 'Base Skills',
      relativePath: 'db/pre-re/skill_db.yml',
      variant: 'PRE_RE',
      priority: 100,
      type: 'BASE',
    };

    const importLayer: DatabaseLayer = {
      id: 'skill-db-import',
      name: 'Import Override Skills',
      relativePath: 'db/import/skill_db.yml',
      variant: 'UNIVERSAL',
      priority: 300,
      type: 'IMPORT',
    };

    const baseResult = parser.parse(baseYaml, baseLayer);
    const importResult = parser.parse(importYaml, importLayer);

    const repo = new LayeredSkillRepository('PRE_RE');
    repo.addLayer({ layer: baseLayer, file: baseResult.file!, adapter: baseResult.adapter });
    repo.addLayer({ layer: importLayer, file: importResult.file!, adapter: importResult.adapter });

    const effective = repo.findById(5);
    expect(effective).toBeDefined();
    expect(effective!.id).toBe(5);
    expect(effective!.name).toBe('SM_BASH');
    expect(effective!.fields.Description).toBe('Custom Server Overpowered Bash');
    expect(effective!.fields.MaxLevel).toBe(15);
    expect(effective!.fields.Type).toBe('Weapon'); // Inherited from base
    expect(effective!.fields.TargetType).toBe('Attack'); // Inherited from base
    expect(effective!.isOverridden).toBe(true);
    expect(effective!.fieldOrigins['Description'].layerId).toBe('skill-db-import');
    expect(effective!.fieldOrigins['Type'].layerId).toBe('skill-db-base');
  });

  it('manages editing sessions with Undo and Redo', () => {
    const skill = createEffectiveSkill({
      id: 5,
      name: 'SM_BASH',
      databaseVariant: 'RE',
      fields: {
        Id: 5,
        Name: 'SM_BASH',
        Description: 'Bash',
        MaxLevel: 10,
      },
      fieldOrigins: {},
      layerProvenance: ['skill-db-base'],
    });

    const session = new SkillEditSession(skill);
    expect(session.isDirty).toBe(false);

    session.setField('MaxLevel', 20);
    expect(session.isDirty).toBe(true);
    expect(session.getPendingChanges().MaxLevel).toBe(20);

    session.undo();
    expect(session.isDirty).toBe(false);
    expect(session.getPendingChanges().MaxLevel).toBeUndefined();

    session.redo();
    expect(session.isDirty).toBe(true);
    expect(session.getPendingChanges().MaxLevel).toBe(20);
  });

  it('validates skill semantic rules correctly', () => {
    const validSkill = createEffectiveSkill({
      id: 5,
      name: 'SM_BASH',
      databaseVariant: 'RE',
      fields: {
        Id: 5,
        Name: 'SM_BASH',
        MaxLevel: 10,
        Type: 'Weapon',
        TargetType: 'Attack',
      },
      fieldOrigins: {},
      layerProvenance: ['skill-db-base'],
    });

    const issues = validator.validateEffectiveSkill(validSkill);
    expect(issues.filter((i) => i.severity === 'error').length).toBe(0);

    const invalidSkill = createEffectiveSkill({
      id: -1,
      name: '',
      databaseVariant: 'RE',
      fields: {
        Id: -1,
        Name: '',
        MaxLevel: 500,
      },
      fieldOrigins: {},
      layerProvenance: ['skill-db-base'],
    });

    const invalidIssues = validator.validateEffectiveSkill(invalidSkill);
    expect(invalidIssues.some((i) => i.field === 'Id' && i.severity === 'error')).toBe(true);
    expect(invalidIssues.some((i) => i.field === 'Name' && i.severity === 'error')).toBe(true);
    expect(invalidIssues.some((i) => i.field === 'MaxLevel' && i.severity === 'error')).toBe(true);
  });

  it('serializes AST changes accurately', () => {
    const yaml = `
Header:
  Type: SKILL_DB
  Version: 3
Body:
  - Id: 5
    Name: SM_BASH
    MaxLevel: 10
`;
    const layer: DatabaseLayer = {
      id: 'skill-db-test',
      name: 'Test',
      relativePath: 'db/skill_db.yml',
      variant: 'UNIVERSAL',
      priority: 100,
      type: 'BASE',
    };

    const parseResult = parser.parse(yaml, layer);
    const layerData = { layer, file: parseResult.file!, adapter: parseResult.adapter };

    serializer.updateFieldById(layerData, 5, 'MaxLevel', 15);
    const output = serializer.serialize(layerData, 'RE');

    expect(output).toContain('MaxLevel: 15');
  });
});
