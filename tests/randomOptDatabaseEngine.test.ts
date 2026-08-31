import { describe, it, expect } from 'vitest';
import { RandomOptDatabaseParser } from '@/services/database/randomOpt/randomOptDatabaseParser';
import { LayeredRandomOptRepository } from '@/services/database/randomOpt/layeredRandomOptRepository';
import { RandomOptionEditSession, RandomOptionGroupEditSession } from '@/domain/database/workspace/randomOptEditSession';
import { DatabaseLayer } from '@/domain/database/common/databaseLayer';

describe('RandomOptDatabaseEngine & AST Round-Trip', () => {
  const optLayer: DatabaseLayer = {
    id: 'randomopt-db-base-root',
    name: 'Random Option Base',
    relativePath: 'db/item_randomopt_db.yml',
    variant: 'UNIVERSAL',
    priority: 100,
    type: 'BASE',
  };

  const grpLayer: DatabaseLayer = {
    id: 'randomopt-grp-db-base-root',
    name: 'Random Option Group Base',
    relativePath: 'db/item_randomopt_group.yml',
    variant: 'UNIVERSAL',
    priority: 110,
    type: 'BASE',
  };

  const sampleOptYaml = `# Random Options
Header:
  Type: RANDOM_OPTION_DB
  Version: 1

Body:
  - Id: 1
    Option: VAR_MAXHPAMOUNT
    Script: |
      bonus bMaxHP, getrandomoptinfo(ROPT_VALUE);

  - Id: 2
    Option: VAR_MAXSPAMOUNT
    Script: |
      bonus bMaxSP, getrandomoptinfo(ROPT_VALUE);
`;

  const sampleGrpYaml = `# Random Option Groups
Header:
  Type: RANDOM_OPTION_GROUP
  Version: 1

Body:
  - Id: 1
    Group: ROPTG_PHYSICAL
    MaxRandom: 5
    Slots:
      - Slot: 1
        Options:
          - Option: VAR_MAXHPAMOUNT
            MinValue: 100
            MaxValue: 1000
            Param: 0
            Chance: 5000
`;

  it('should parse Random Options and Option Groups', () => {
    const parser = new RandomOptDatabaseParser();
    const optResult = parser.parse(sampleOptYaml, optLayer);
    const grpResult = parser.parse(sampleGrpYaml, grpLayer);

    expect(optResult.isValid).toBe(true);
    expect(optResult.optionFile?.options).toHaveLength(2);
    expect(optResult.optionFile?.options[0].option).toBe('VAR_MAXHPAMOUNT');

    expect(grpResult.isValid).toBe(true);
    expect(grpResult.groupFile?.groups).toHaveLength(1);
    expect(grpResult.groupFile?.groups[0].group).toBe('ROPTG_PHYSICAL');
  });

  it('should resolve options and groups in repository', () => {
    const parser = new RandomOptDatabaseParser();
    const optResult = parser.parse(sampleOptYaml, optLayer);
    const grpResult = parser.parse(sampleGrpYaml, grpLayer);

    const repo = new LayeredRandomOptRepository('RE');
    repo.addOptionLayer({
      layer: optLayer,
      file: optResult.optionFile!,
      adapter: optResult.adapter,
    });
    repo.addGroupLayer({
      layer: grpLayer,
      file: grpResult.groupFile!,
      adapter: grpResult.adapter,
    });

    const opt = repo.findOptionById(1);
    expect(opt?.option).toBe('VAR_MAXHPAMOUNT');

    const grp = repo.findGroupById(1);
    expect(grp?.group).toBe('ROPTG_PHYSICAL');
    expect(grp?.fields.Slots[0].Options[0].MinValue).toBe(100);
  });

  it('should support editing in RandomOptionEditSession and RandomOptionGroupEditSession', () => {
    const parser = new RandomOptDatabaseParser();
    const optResult = parser.parse(sampleOptYaml, optLayer);
    const grpResult = parser.parse(sampleGrpYaml, grpLayer);

    const repo = new LayeredRandomOptRepository('RE');
    repo.addOptionLayer({
      layer: optLayer,
      file: optResult.optionFile!,
      adapter: optResult.adapter,
    });
    repo.addGroupLayer({
      layer: grpLayer,
      file: grpResult.groupFile!,
      adapter: grpResult.adapter,
    });

    const opt = repo.findOptionById(1)!;
    const session = new RandomOptionEditSession(opt);

    expect(session.isDirty).toBe(false);
    session.setField('Option', 'VAR_CUSTOM_HP');
    expect(session.isDirty).toBe(true);
    expect(session.getEffectiveFields().Option).toBe('VAR_CUSTOM_HP');

    const grp = repo.findGroupById(1)!;
    const grpSession = new RandomOptionGroupEditSession(grp);
    expect(grpSession.isDirty).toBe(false);
    grpSession.setField('MaxRandom', 10);
    expect(grpSession.isDirty).toBe(true);
    expect(grpSession.getEffectiveFields().MaxRandom).toBe(10);
  });
});
