import { describe, it, expect } from 'vitest';
import { ComboDatabaseParser } from '@/services/database/combo/comboDatabaseParser';
import { ComboDatabaseSerializer } from '@/services/database/combo/comboDatabaseSerializer';
import { LayeredComboRepository } from '@/services/database/combo/layeredComboRepository';
import { ComboEditSession } from '@/domain/database/workspace/comboEditSession';
import { DatabaseLayer } from '@/domain/database/common/databaseLayer';

describe('ComboDatabaseEngine & AST Round-Trip', () => {
  const sampleLayer: DatabaseLayer = {
    id: 'combo-db-base-root',
    name: 'Combo Base',
    relativePath: 'db/item_combos.yml',
    variant: 'UNIVERSAL',
    priority: 100,
    type: 'BASE',
  };

  const sampleYaml = `# rAthena Item Combos Table
Header:
  Type: ITEM_COMBOS_DB
  Version: 1

Body:
  - Combo:
      - Apple
      - Banana
    Script: |
      bonus bMaxHP, 100;
      bonus bMaxSP, 50;

  - Combo:
      - Iron
      - Steel
      - Oridecon
    Script: |
      bonus bAtk, 25;
`;

  it('should correctly parse Header and Body combos', () => {
    const parser = new ComboDatabaseParser();
    const result = parser.parse(sampleYaml, sampleLayer);

    expect(result.isValid).toBe(true);
    expect(result.file?.combos).toHaveLength(2);

    const first = result.file?.combos[0];
    expect(first?.fields.Combo).toEqual(['Apple', 'Banana']);
    expect(first?.key).toBe('Apple + Banana');
    expect(first?.fields.Script).toContain('bonus bMaxHP, 100;');
  });

  it('should resolve layered combo inheritance and reverse item lookup', () => {
    const parser = new ComboDatabaseParser();
    const result = parser.parse(sampleYaml, sampleLayer);

    const repo = new LayeredComboRepository('RE');
    repo.addLayer({
      layer: sampleLayer,
      file: result.file!,
      adapter: result.adapter,
    });

    const combos = repo.getAllEffectiveCombos();
    expect(combos).toHaveLength(2);

    const appleCombos = repo.findCombosForItem('Apple');
    expect(appleCombos).toHaveLength(1);
    expect(appleCombos[0].key).toBe('Apple + Banana');

    const steelCombos = repo.findCombosForItem('Steel');
    expect(steelCombos).toHaveLength(1);
    expect(steelCombos[0].key).toBe('Iron + Oridecon + Steel');
  });

  it('should support Undo/Redo in ComboEditSession', () => {
    const parser = new ComboDatabaseParser();
    const result = parser.parse(sampleYaml, sampleLayer);

    const repo = new LayeredComboRepository('RE');
    repo.addLayer({
      layer: sampleLayer,
      file: result.file!,
      adapter: result.adapter,
    });

    const combo = repo.findByKey('Apple + Banana')!;
    const session = new ComboEditSession(combo);

    expect(session.isDirty).toBe(false);

    session.setField('Script', 'bonus bMaxHP, 500;');
    expect(session.isDirty).toBe(true);
    expect(session.getEffectiveFields().Script).toBe('bonus bMaxHP, 500;');

    session.undo();
    expect(session.isDirty).toBe(false);
    expect(session.getEffectiveFields().Script).toContain('bonus bMaxHP, 100;');

    session.redo();
    expect(session.isDirty).toBe(true);
    expect(session.getEffectiveFields().Script).toBe('bonus bMaxHP, 500;');
  });

  it('should mutate AST and serialize preserving YAML comments and structure', () => {
    const parser = new ComboDatabaseParser();
    const result = parser.parse(sampleYaml, sampleLayer);

    const serializer = new ComboDatabaseSerializer();
    serializer.updateComboField(result.adapter, 0, 'Script', 'bonus bMaxHP, 999;\n');

    const serialized = serializer.serialize(
      {
        layer: sampleLayer,
        file: result.file!,
        adapter: result.adapter,
      },
      'RE'
    );

    expect(serialized).toContain('# rAthena Item Combos Table');
    expect(serialized).toContain('bonus bMaxHP, 999;');
    expect(serialized).toContain('Type: ITEM_COMBOS_DB');
  });
});
