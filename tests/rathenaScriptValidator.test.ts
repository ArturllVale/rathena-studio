import { describe, it, expect } from 'vitest';
import { RathenaScriptValidator } from '../src/services/script/rathenaScriptValidator';
import { ALL_SCRIPT_COMPLETIONS, RATHENA_ITEM_BONUSES } from '../src/services/script/rathenaScriptDefinitions';

describe('rAthena Script Validator & Item Bonus Definitions', () => {
  it('loads all standard item bonuses from doc/item_bonus.txt', () => {
    expect(ALL_SCRIPT_COMPLETIONS.length).toBeGreaterThan(50);
    const hasStr = RATHENA_ITEM_BONUSES.some((b) => b.name === 'bStr');
    const hasAutoSpell = RATHENA_ITEM_BONUSES.some((b) => b.name === 'bAutoSpell');
    const hasAtkRate = RATHENA_ITEM_BONUSES.some((b) => b.name === 'bAtkRate');
    expect(hasStr).toBe(true);
    expect(hasAutoSpell).toBe(true);
    expect(hasAtkRate).toBe(true);
  });

  it('validates clean scripts without syntax errors or warnings', () => {
    const script = `bonus bStr, 5;\nbonus bMaxHPrate, 10;\npercentheal 100, 100;`;
    const issues = RathenaScriptValidator.validate(script);
    expect(issues.length).toBe(0);
  });

  it('detects missing semicolons', () => {
    const script = `bonus bStr, 5\nbonus bAgi, 5;`;
    const issues = RathenaScriptValidator.validate(script);
    expect(issues.some((i) => i.message.includes('Missing semicolon'))).toBe(true);
  });

  it('detects unrecognized bonus names', () => {
    const script = `bonus bNonExistentStat, 5;`;
    const issues = RathenaScriptValidator.validate(script);
    expect(issues.some((i) => i.message.includes('Unrecognized bonus constant'))).toBe(true);
  });

  it('detects unclosed brackets', () => {
    const script = `if (getrefine() >= 7) {\n  bonus bAtk, 15;\n`;
    const issues = RathenaScriptValidator.validate(script);
    expect(issues.some((i) => i.message.includes('Unmatched curly braces'))).toBe(true);
  });
});
