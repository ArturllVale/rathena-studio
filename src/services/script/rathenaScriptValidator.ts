import { RATHENA_ITEM_BONUSES } from './rathenaScriptDefinitions';

export interface ScriptSyntaxIssue {
  line: number;
  message: string;
  severity: 'error' | 'warning';
}

const KNOWN_BONUSES = new Set(RATHENA_ITEM_BONUSES.map((b) => b.name));

export class RathenaScriptValidator {
  public static validate(scriptContent: string): ScriptSyntaxIssue[] {
    const issues: ScriptSyntaxIssue[] = [];
    if (!scriptContent || scriptContent.trim() === '') return issues;

    const lines = scriptContent.split('\n');
    let openBraces = 0;
    let openParens = 0;

    for (let i = 0; i < lines.length; i++) {
      const lineNum = i + 1;
      const rawLine = lines[i];
      // Strip comments
      const commentIdx = rawLine.indexOf('//');
      const cleanLine = (commentIdx !== -1 ? rawLine.substring(0, commentIdx) : rawLine).trim();

      if (!cleanLine) continue;

      // Count brackets
      for (const char of cleanLine) {
        if (char === '{') openBraces++;
        if (char === '}') openBraces--;
        if (char === '(') openParens++;
        if (char === ')') openParens--;
      }

      // Check missing semicolon on executable statements
      const isBlockHeader = cleanLine.endsWith('{') || cleanLine.startsWith('if') || cleanLine.startsWith('else');
      const isClosingBrace = cleanLine === '}' || cleanLine.endsWith('}');
      if (!isBlockHeader && !isClosingBrace && !cleanLine.endsWith(';')) {
        issues.push({
          line: lineNum,
          message: `Missing semicolon ';' at the end of statement: "${cleanLine}"`,
          severity: 'warning',
        });
      }

      // Check unknown bonus names
      const bonusMatch = cleanLine.match(/bonus[2-5]?\s+([a-zA-Z0-9_]+)/);
      if (bonusMatch) {
        const bonusName = bonusMatch[1];
        if (!KNOWN_BONUSES.has(bonusName)) {
          issues.push({
            line: lineNum,
            message: `Unrecognized bonus constant "${bonusName}". Check spelling against item_bonus.txt`,
            severity: 'warning',
          });
        }
      }
    }

    if (openBraces !== 0) {
      issues.push({
        line: lines.length,
        message: `Unmatched curly braces: ${openBraces > 0 ? `${openBraces} unclosed '{'` : `${Math.abs(openBraces)} extra '}'`}`,
        severity: 'error',
      });
    }

    if (openParens !== 0) {
      issues.push({
        line: lines.length,
        message: `Unmatched parentheses: ${openParens > 0 ? `${openParens} unclosed '('` : `${Math.abs(openParens)} extra ')'`}`,
        severity: 'error',
      });
    }

    return issues;
  }
}
