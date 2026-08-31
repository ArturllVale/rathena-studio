import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { ComboDatabaseParser } from '../src/services/database/combo/comboDatabaseParser';
import { ItemGroupDatabaseParser } from '../src/services/database/itemGroup/itemGroupDatabaseParser';
import { ItemPackageDatabaseParser } from '../src/services/database/itemPackage/itemPackageDatabaseParser';
import { RandomOptDatabaseParser } from '../src/services/database/randomOpt/randomOptDatabaseParser';
import { DatabaseLayer } from '../src/domain/database/common/databaseLayer';

const HORIZON_DB_PATH = path.resolve('..', 'horizonro', 'db');

describe('HorizonRO Real Database Compatibility Audit', () => {
  const hasHorizon = fs.existsSync(HORIZON_DB_PATH);

  it('verifies real horizonro repository folder existence', () => {
    expect(hasHorizon).toBe(true);
  });

  if (hasHorizon) {
    it('parses real horizonro item_combos.yml', () => {
      const filePath = path.join(HORIZON_DB_PATH, 'pre-re', 'item_combos.yml');
      if (fs.existsSync(filePath)) {
        const rawYaml = fs.readFileSync(filePath, 'utf-8');
        const layer: DatabaseLayer = {
          id: 'pre-re/item_combos',
          name: 'Pre-Re Combos',
          type: 'BASE',
          relativePath: 'db/pre-re/item_combos.yml',
          variant: 'PRE_RE',
          priority: 10,
        };
        const parser = new ComboDatabaseParser();
        const result = parser.parse(rawYaml, layer);

        expect(result.isValid).toBe(true);
        expect(result.file?.combos.length).toBeGreaterThan(50);
      }
    });

    it('parses real horizonro item_group_db.yml', () => {
      const filePath = path.join(HORIZON_DB_PATH, 'pre-re', 'item_group_db.yml');
      if (fs.existsSync(filePath)) {
        const rawYaml = fs.readFileSync(filePath, 'utf-8');
        const layer: DatabaseLayer = {
          id: 'pre-re/item_group_db',
          name: 'Pre-Re Groups',
          type: 'BASE',
          relativePath: 'db/pre-re/item_group_db.yml',
          variant: 'PRE_RE',
          priority: 10,
        };
        const parser = new ItemGroupDatabaseParser();
        const result = parser.parse(rawYaml, layer);

        expect(result.isValid).toBe(true);
        expect(result.file?.groups.length).toBeGreaterThan(10);
      }
    });

    it('parses real horizonro item_packages.yml', () => {
      const filePath = path.join(HORIZON_DB_PATH, 're', 'item_packages.yml');
      if (fs.existsSync(filePath)) {
        const rawYaml = fs.readFileSync(filePath, 'utf-8');
        const layer: DatabaseLayer = {
          id: 're/item_packages',
          name: 'Re Packages',
          type: 'BASE',
          relativePath: 'db/re/item_packages.yml',
          variant: 'RE',
          priority: 10,
        };
        const parser = new ItemPackageDatabaseParser();
        const result = parser.parse(rawYaml, layer);

        expect(result.isValid).toBe(true);
        expect(result.file?.packages.length).toBeGreaterThan(5);
      }
    });

    it('parses real horizonro item_randomopt_db.yml', () => {
      const filePath = path.join(HORIZON_DB_PATH, 're', 'item_randomopt_db.yml');
      if (fs.existsSync(filePath)) {
        const rawYaml = fs.readFileSync(filePath, 'utf-8');
        const layer: DatabaseLayer = {
          id: 're/item_randomopt_db',
          name: 'Re Random Opt',
          type: 'BASE',
          relativePath: 'db/re/item_randomopt_db.yml',
          variant: 'RE',
          priority: 10,
        };
        const parser = new RandomOptDatabaseParser();
        const result = parser.parse(rawYaml, layer);

        expect(result.isValid).toBe(true);
        expect(result.optionFile?.options.length).toBeGreaterThan(100);
      }
    });

    it('parses real horizonro item_randomopt_group.yml', () => {
      const filePath = path.join(HORIZON_DB_PATH, 're', 'item_randomopt_group.yml');
      if (fs.existsSync(filePath)) {
        const rawYaml = fs.readFileSync(filePath, 'utf-8');
        const layer: DatabaseLayer = {
          id: 're/item_randomopt_group',
          name: 'Re Random Opt Group',
          type: 'BASE',
          relativePath: 'db/re/item_randomopt_group.yml',
          variant: 'RE',
          priority: 10,
        };
        const parser = new RandomOptDatabaseParser();
        const result = parser.parse(rawYaml, layer);

        expect(result.isValid).toBe(true);
        expect(result.groupFile?.groups.length).toBeGreaterThan(5);
      }
    });
  }
});
