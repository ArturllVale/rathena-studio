import { describe, it, expect } from 'vitest';
import * as path from 'path';
import * as fs from 'fs/promises';
import { MobDatabaseParser } from '../src/services/database/mob/mobDatabaseParser';
import { LayeredMobRepository } from '../src/services/database/mob/layeredMobRepository';
import { MobDatabaseValidator } from '../src/services/database/mobDatabaseValidator';
import { MobEditSession } from '../src/domain/database/workspace/mobEditSession';
import { DatabaseLayer } from '../src/domain/database/common/databaseLayer';
import { MobDatabaseSerializer } from '../src/services/database/mob/mobDatabaseSerializer';
import { computeEffectiveMobModes } from '../src/domain/database/mob/mobAiDefinitions';
import { EffectiveMob } from '../src/domain/database/mob/effectiveMob';

const HORIZONRO_DB_PATH = 'C:\\Users\\artur.vale\\OneDrive - SISTEMA FIEPA\\Documentos\\Pessoal\\github\\horizonro\\db';

describe('Monster Database Engine (MOB_DB) Tests', () => {
  const parser = new MobDatabaseParser();
  const validator = new MobDatabaseValidator();
  const serializer = new MobDatabaseSerializer();

  it('parses real rAthena pre-re mob_db.yml without errors', async () => {
    const filePath = path.join(HORIZONRO_DB_PATH, 'pre-re', 'mob_db.yml');
    const rawYaml = await fs.readFile(filePath, 'utf-8');

    const layer: DatabaseLayer = {
      id: 'mob-db-pre-re',
      name: 'Mob DB Pre-RE',
      relativePath: 'db/pre-re/mob_db.yml',
      variant: 'PRE_RE',
      priority: 200,
      type: 'MODE_SPECIFIC',
    };

    const result = parser.parse(rawYaml, layer);
    expect(result.isValid).toBe(true);
    expect(result.file).toBeDefined();
    expect(result.file!.mobs.size).toBeGreaterThan(1000);

    const scorpion = result.file!.mobs.get(1001);
    expect(scorpion).toBeDefined();
    expect(scorpion?.fields.AegisName).toBe('SCORPION');
    expect(scorpion?.fields.Race).toBe('Insect');
    expect(scorpion?.fields.Element).toBe('Fire');
    expect(scorpion?.fields.Drops?.length).toBeGreaterThan(0);
  });

  it('parses real rAthena renewal mob_db.yml without errors', async () => {
    const filePath = path.join(HORIZONRO_DB_PATH, 're', 'mob_db.yml');
    const rawYaml = await fs.readFile(filePath, 'utf-8');

    const layer: DatabaseLayer = {
      id: 'mob-db-re',
      name: 'Mob DB Renewal',
      relativePath: 'db/re/mob_db.yml',
      variant: 'RE',
      priority: 200,
      type: 'MODE_SPECIFIC',
    };

    const result = parser.parse(rawYaml, layer);
    if (!result.isValid) {
      console.error('Mob DB RE Errors:', result.diagnostics.filter(d => d.severity === 'error'));
    }
    expect(result.isValid).toBe(true);
    expect(result.file).toBeDefined();
    expect(result.file!.mobs.size).toBeGreaterThan(1000);
  });

  it('resolves multi-layer inheritance with import overrides', async () => {
    const rePath = path.join(HORIZONRO_DB_PATH, 're', 'mob_db.yml');
    const importPath = path.join(HORIZONRO_DB_PATH, 'import', 'mob_db.yml');

    const reYaml = await fs.readFile(rePath, 'utf-8');
    const importYaml = await fs.readFile(importPath, 'utf-8');

    const repo = new LayeredMobRepository('RE');

    const baseLayer: DatabaseLayer = {
      id: 'mob-db-re',
      name: 'Mob DB RE',
      relativePath: 'db/re/mob_db.yml',
      variant: 'RE',
      priority: 200,
      type: 'MODE_SPECIFIC',
    };

    const importLayer: DatabaseLayer = {
      id: 'mob-db-import',
      name: 'Mob DB Import',
      relativePath: 'db/import/mob_db.yml',
      variant: 'UNIVERSAL',
      priority: 300,
      type: 'IMPORT',
    };

    const baseParsed = parser.parse(reYaml, baseLayer);
    const importParsed = parser.parse(importYaml, importLayer);

    repo.addLayer({ layer: baseLayer, file: baseParsed.file!, adapter: baseParsed.adapter });
    repo.addLayer({ layer: importLayer, file: importParsed.file!, adapter: importParsed.adapter });

    const allMobs = repo.getAllEffectiveMobs();
    expect(allMobs.length).toBeGreaterThan(1000);

    const poring = repo.findById(1002);
    expect(poring).toBeDefined();
    expect(poring?.fields.Name).toBe('Poring');
  });

  it('validates mob entities and detects syntax/semantic errors', () => {
    const invalidMob = {
      id: -5,
      databaseVariant: 'RE' as const,
      fields: {
        Id: -5,
        AegisName: 'INVALID NAME WITH SPACES',
        Name: '',
        Level: 2000,
        Hp: -100,
        Element: 'NonExistent' as any,
      },
      fieldOrigins: {},
      layerProvenance: ['base'],
      isOverridden: false,
    };

    const issues = validator.validateEffectiveMob(invalidMob);
    expect(issues.some((i) => i.field === 'Id')).toBe(true);
    expect(issues.some((i) => i.field === 'Name')).toBe(true);
    expect(issues.some((i) => i.field === 'AegisName')).toBe(true);
    expect(issues.some((i) => i.field === 'Level')).toBe(true);
    expect(issues.some((i) => i.field === 'Hp')).toBe(true);
  });

  it('supports full undo/redo stack and dirty state tracking on MobEditSession', () => {
    const sampleMob = {
      id: 1002,
      databaseVariant: 'RE' as const,
      fields: {
        Id: 1002,
        AegisName: 'PORING',
        Name: 'Poring',
        Level: 1,
        Hp: 50,
        Element: 'Water' as const,
      },
      fieldOrigins: {},
      layerProvenance: ['base'],
      isOverridden: false,
    };

    const session = new MobEditSession(sampleMob);
    expect(session.isDirty).toBe(false);

    session.setField('Hp', 100);
    expect(session.isDirty).toBe(true);
    expect(session.getPendingChanges().Hp).toBe(100);

    session.setField('Level', 10);
    expect(session.canUndo).toBe(true);

    session.undo();
    expect(session.getPendingChanges().Level).toBeUndefined();
    expect(session.getPendingChanges().Hp).toBe(100);

    session.redo();
    expect(session.getPendingChanges().Level).toBe(10);
  });

  it('serializes mob mutations into YAML AST preserving structure', () => {
    const sampleYaml = `
Header:
  Type: MOB_DB
  Version: 3

Body:
  - Id: 1001
    AegisName: SCORPION
    Name: Scorpion
    Level: 16
    Hp: 153
`;

    const layer: DatabaseLayer = {
      id: 'test-layer',
      name: 'Test',
      relativePath: 'db/re/mob_db.yml',
      variant: 'RE',
      priority: 200,
      type: 'MODE_SPECIFIC',
    };

    const parseResult = parser.parse(sampleYaml, layer);
    expect(parseResult.isValid).toBe(true);

    const layerData = {
      layer,
      file: parseResult.file!,
      adapter: parseResult.adapter,
    };

    serializer.updateFieldById(layerData, 1001, 'Hp', 9999);
    serializer.updateFieldById(layerData, 1001, 'Modes', { Aggressive: true, Detector: true });

    const mutatedYaml = layerData.adapter.toString();
    expect(mutatedYaml).toContain('Hp: 9999');
    expect(mutatedYaml).toContain('Aggressive: true');
  });

  it('computes effective modes correctly for Poring (AI 02: Passive, Looter)', () => {
    const resolved = computeEffectiveMobModes({
      ai: '02',
      mobClass: 'Normal',
      race: 'Plant',
      explicitModes: {},
    });

    expect(resolved.CanMove?.isEnabled).toBe(true);
    expect(resolved.Looter?.isEnabled).toBe(true);
    expect(resolved.CanAttack?.isEnabled).toBe(true);
    expect(resolved.Aggressive?.isEnabled).toBeFalsy();
  });

  it('supports explicit YAML overrides over base AI modes', () => {
    const resolved = computeEffectiveMobModes({
      ai: '02',
      mobClass: 'Normal',
      race: 'Plant',
      explicitModes: {
        Looter: false, // Override inherited looter off
        Aggressive: true, // Override to aggressive
      },
    });

    expect(resolved.CanMove?.isEnabled).toBe(true);
    expect(resolved.Looter?.isEnabled).toBe(false);
    expect(resolved.Looter?.origin).toBe('explicit');
    expect(resolved.Aggressive?.isEnabled).toBe(true);
    expect(resolved.Aggressive?.origin).toBe('explicit');
  });

  it('correctly tracks and mutates drops in MobEditSession', () => {
    const mockMob = {
      id: 1002,
      aegisName: 'PORING',
      fields: {
        Id: 1002,
        AegisName: 'PORING',
        Name: 'Poring',
        Drops: [{ Item: 'Jellopy', Rate: 7000 }],
      },
      fieldOrigins: {},
      layerProvenance: ['mob-db-base-root'],
    };

    const session = new MobEditSession(mockMob as unknown as EffectiveMob);
    expect(session.isDirty).toBe(false);

    // Add drop
    const newDrops = [...(session.originalMob.fields.Drops || []), { Item: 'Apple', Rate: 1000 }];
    session.setField('Drops', newDrops);

    expect(session.isDirty).toBe(true);
    const pending = session.getPendingChanges();
    expect(pending.Drops).toHaveLength(2);
    expect(pending.Drops?.[1].Item).toBe('Apple');

    // Undo
    session.undo();
    expect(session.isDirty).toBe(false);
    expect(session.getPendingChanges().Drops).toBeUndefined();

    // Redo
    session.redo();
    expect(session.isDirty).toBe(true);
    expect(session.getPendingChanges().Drops).toHaveLength(2);
  });
});

