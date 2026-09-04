import type { Monaco } from '@monaco-editor/react';
import type * as monacoType from 'monaco-editor';
import { ALL_SCRIPT_COMPLETIONS, ScriptCompletionItem } from '@/services/script/rathenaScriptDefinitions';

export const RATHENA_SCRIPT_LANGUAGE_ID = 'rathena-script';

export const RATHENA_KEYWORDS = [
  'bonus',
  'bonus2',
  'bonus3',
  'bonus4',
  'bonus5',
  'autospell',
  'autospell2',
  'autospell3',
  'skill',
  'heal',
  'itemheal',
  'percentheal',
  'sc_start',
  'sc_start2',
  'sc_start4',
  'sc_end',
  'getitem',
  'delitem',
  'rentitem',
  'warp',
  'skilleffect',
  'specialeffect',
  'specialeffect2',
  'soundeffect',
  'misceffect',
  'mes',
  'close',
  'close2',
  'next',
  'set',
  'setarray',
  'cleararray',
  'copyarray',
  'if',
  'else',
  'while',
  'for',
  'do',
  'switch',
  'case',
  'default',
  'break',
  'continue',
  'return',
  'callsub',
  'callfunc',
  'getrefine',
  'getequipid',
  'getequiprefinerycnt',
  'getequipweaponlv',
  'isequipped',
  'isequippedcnt',
  'readparam',
  'bStr',
  'bAgi',
  'bVit',
  'bInt',
  'bDex',
  'bLuk',
  'bAllStats',
  'bMaxHP',
  'bMaxSP',
  'bMaxHPrate',
  'bMaxSPrate',
  'bAtk',
  'bAtk2',
  'bAtkRate',
  'bMatk',
  'bMatkRate',
  'bDef',
  'bDef2',
  'bDefRate',
  'bMdef',
  'bMdef2',
  'bMdefRate',
  'bHit',
  'bHitRate',
  'bFlee',
  'bFlee2',
  'bFleeRate',
  'bCritical',
  'bCriticalRate',
  'bCriticalDef',
  'bAspd',
  'bAspdRate',
  'bSpeedRate',
  'bCastrate',
  'bUseSPrate',
  'bDelayrate',
  'bHPDrainRate',
  'bSPDrainRate',
  'bSplashRange',
  'bSplashAddRange',
  'bDoubleRate',
  'bShortWeaponDamageReturn',
  'bLongWeaponDamageReturn',
  'bMagicDamageReturn',
];

export const rathenaLanguageConfiguration: monacoType.languages.LanguageConfiguration = {
  comments: {
    lineComment: '//',
    blockComment: ['/*', '*/'],
  },
  brackets: [
    ['{', '}'],
    ['[', ']'],
    ['(', ')'],
  ],
  autoClosingPairs: [
    { open: '{', close: '}' },
    { open: '[', close: ']' },
    { open: '(', close: ')' },
    { open: '"', close: '"', notIn: ['string'] },
  ],
  surroundingPairs: [
    { open: '{', close: '}' },
    { open: '[', close: ']' },
    { open: '(', close: ')' },
    { open: '"', close: '"' },
  ],
};

export const rathenaMonarchTokensProvider: monacoType.languages.IMonarchLanguage = {
  keywords: RATHENA_KEYWORDS,
  operators: ['=', '>', '<', '!', '~', '?', ':', '==', '<=', '>=', '!=', '&&', '||', '++', '--', '+', '-', '*', '/', '&', '|', '^', '%', '<<', '>>'],
  symbols: /[=><!~?:&|+\-*^%/]+/,
  tokenizer: {
    root: [
      [/[a-zA-Z_]\w*/, {
        cases: {
          '@keywords': 'keyword',
          '@default': 'identifier',
        },
      }],
      { include: '@whitespace' },
      [/[{}()[\]]/, '@brackets'],
      [/@operators/, 'operator'],
      [/\d*\.\d+([eE][-+]?\d+)?/, 'number.float'],
      [/0[xX][0-9a-fA-F]+/, 'number.hex'],
      [/\d+/, 'number'],
      [/[;,.]/, 'delimiter'],
      [/"([^"\\]|\\.)*$/, 'string.invalid'],
      [/"/, { token: 'string.quote', bracket: '@open', next: '@string' }],
    ],
    comment: [
      [/[^/*]+/, 'comment'],
      [/\/\*/, 'comment', '@push'],
      ['\\*/', 'comment', '@pop'],
      [/[/*]/, 'comment'],
    ],
    string: [
      [/[^\\"]+/, 'string'],
      [/\\./, 'string.escape'],
      [/"/, { token: 'string.quote', bracket: '@close', next: '@pop' }],
    ],
    whitespace: [
      [/[ \t\r\n]+/, 'white'],
      [/\/\*/, 'comment', '@comment'],
      [/\/\/.*$/, 'comment'],
    ],
  },
};

export function registerRathenaScriptLanguage(monaco: Monaco): void {
  if (monaco.languages.getLanguages().some((lang: { id: string }) => lang.id === RATHENA_SCRIPT_LANGUAGE_ID)) {
    return;
  }

  monaco.languages.register({ id: RATHENA_SCRIPT_LANGUAGE_ID });
  monaco.languages.setLanguageConfiguration(RATHENA_SCRIPT_LANGUAGE_ID, rathenaLanguageConfiguration);
  monaco.languages.setMonarchTokensProvider(RATHENA_SCRIPT_LANGUAGE_ID, rathenaMonarchTokensProvider);

  // Autocompletion Provider
  monaco.languages.registerCompletionItemProvider(RATHENA_SCRIPT_LANGUAGE_ID, {
    provideCompletionItems: (model: monacoType.editor.ITextModel, position: monacoType.Position) => {
      const word = model.getWordUntilPosition(position);
      const range: monacoType.IRange = {
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: word.startColumn,
        endColumn: word.endColumn,
      };

      const suggestions: monacoType.languages.CompletionItem[] = ALL_SCRIPT_COMPLETIONS.map((item: ScriptCompletionItem) => {
        let insertText = item.name;
        let snippetKind = monaco.languages.CompletionItemKind.Function;

        if (item.kind === 'bonus') {
          snippetKind = monaco.languages.CompletionItemKind.Variable;
          if (item.name.startsWith('bAdd') || item.name.startsWith('bSub') || item.name.startsWith('bSkill')) {
            insertText = `bonus2 ${item.name}, \${1:param}, \${2:val};`;
          } else if (item.name.includes('AutoSpell')) {
            insertText = `bonus3 ${item.name}, "\${1:SKILL_NAME}", \${2:level}, \${3:chance};`;
          } else {
            insertText = `bonus ${item.name}, \${1:val};`;
          }
        } else if (item.kind === 'constant') {
          snippetKind = monaco.languages.CompletionItemKind.Constant;
          insertText = item.name;
        }

        return {
          label: item.name,
          kind: snippetKind,
          detail: item.detail,
          documentation: {
            value: `**${item.name}** (${item.kind})\n\n${item.documentation}\n\n\`${item.detail}\``,
          },
          insertText,
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          range,
        };
      });

      return { suggestions };
    },
  });

  // Hover Documentation Provider
  monaco.languages.registerHoverProvider(RATHENA_SCRIPT_LANGUAGE_ID, {
    provideHover: (model: monacoType.editor.ITextModel, position: monacoType.Position) => {
      const word = model.getWordAtPosition(position);
      if (!word) return null;

      const matched = ALL_SCRIPT_COMPLETIONS.find(
        (item) => item.name.toLowerCase() === word.word.toLowerCase()
      );

      if (!matched) return null;

      return {
        range: new monaco.Range(
          position.lineNumber,
          word.startColumn,
          position.lineNumber,
          word.endColumn
        ),
        contents: [
          { value: `**${matched.name}** *(${matched.kind})*` },
          { value: `\`${matched.detail}\`` },
          { value: matched.documentation },
        ],
      };
    },
  });
}
