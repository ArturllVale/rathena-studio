import { describe, it, expect, beforeEach } from 'vitest';
import {
  rathenaMonarchTokensProvider,
  rathenaLanguageConfiguration,
  RATHENA_KEYWORDS,
} from '@/features/editor/monaco/rathenaScriptLanguage';
import {
  findEntityLineInYaml,
  useYamlEditorStore,
  openEntityInYamlEditor,
} from '@/stores/yamlEditorStore';
import { useDatabaseStore } from '@/stores/databaseStore';
import { useAppStore } from '@/stores/appStore';

describe('Monaco rAthena Script Language Definition', () => {
  it('should define language tokens, brackets, and keywords', () => {
    expect(rathenaMonarchTokensProvider).toBeDefined();
    expect(rathenaMonarchTokensProvider.keywords).toBeDefined();
    expect(rathenaMonarchTokensProvider.tokenizer).toBeDefined();
    expect(rathenaMonarchTokensProvider.tokenizer.root).toBeDefined();
  });

  it('should include core rAthena script keywords', () => {
    expect(RATHENA_KEYWORDS).toContain('bonus');
    expect(RATHENA_KEYWORDS).toContain('bonus2');
    expect(RATHENA_KEYWORDS).toContain('bonus3');
    expect(RATHENA_KEYWORDS).toContain('bonus4');
    expect(RATHENA_KEYWORDS).toContain('bonus5');
    expect(RATHENA_KEYWORDS).toContain('skill');
    expect(RATHENA_KEYWORDS).toContain('getitem');
    expect(RATHENA_KEYWORDS).toContain('heal');
    expect(RATHENA_KEYWORDS).toContain('percentheal');
    expect(RATHENA_KEYWORDS).toContain('if');
    expect(RATHENA_KEYWORDS).toContain('else');
    expect(RATHENA_KEYWORDS).toContain('return');
  });

  it('should configure auto-closing brackets and comments correctly', () => {
    expect(rathenaLanguageConfiguration.comments?.lineComment).toBe('//');
    expect(rathenaLanguageConfiguration.comments?.blockComment).toEqual(['/*', '*/']);
    expect(rathenaLanguageConfiguration.autoClosingPairs).toBeDefined();
  });

  it('should define symbols regex and have valid monarch tokenizer rules without undefined macro references', () => {
    expect(rathenaMonarchTokensProvider.symbols).toBeDefined();
    expect(rathenaMonarchTokensProvider.symbols).toBeInstanceOf(RegExp);

    const rootRules = rathenaMonarchTokensProvider.tokenizer.root;
    const ruleStrings = JSON.stringify(rootRules);
    // Ensure no unhandled @symbols lookarounds exist in regex patterns
    expect(ruleStrings).not.toContain('@symbols');
  });
});

describe('findEntityLineInYaml', () => {
  const sampleYaml = `Header:
  Type: ITEM_DB
  Version: 3

Body:
  - Id: 501
    AegisName: Red_Potion
    Name: Red Potion
    Type: Usable
    Buy: 50
    Weight: 70

  - Id: 502
    AegisName: Orange_Potion
    Name: Orange Potion
    Type: Usable
    Buy: 200
    Weight: 100

  - Id: 1101
    AegisName: Sword
    Name: Sword
    Type: Weapon
`;

  it('should locate entity by exact Id', () => {
    const line501 = findEntityLineInYaml(sampleYaml, 501);
    expect(line501).toBe(6);

    const line502 = findEntityLineInYaml(sampleYaml, 502);
    expect(line502).toBe(13);

    const line1101 = findEntityLineInYaml(sampleYaml, 1101);
    expect(line1101).toBe(20);
  });

  it('should locate entity by AegisName', () => {
    const lineRedPotion = findEntityLineInYaml(sampleYaml, 'Red_Potion');
    expect(lineRedPotion).toBe(7);

    const lineSword = findEntityLineInYaml(sampleYaml, 'Sword');
    expect(lineSword).toBe(21);
  });

  it('should locate entity by Group / Package / Option keyword', () => {
    const groupYaml = `Header:
  Type: ITEM_GROUP_DB
Body:
  - Group: IG_Potion
    List:
      - Item: Red_Potion
        Rate: 10000
  - Group: IG_Scroll
    List:
      - Item: Scroll
`;
    expect(findEntityLineInYaml(groupYaml, 'IG_Potion')).toBe(4);
    expect(findEntityLineInYaml(groupYaml, 'IG_Scroll')).toBe(8);
  });

  it('should fall back to substring search if no exact Id/AegisName is found', () => {
    expect(findEntityLineInYaml(sampleYaml, 'Orange Potion')).toBe(15);
  });

  it('should return line 1 if query is not found or empty', () => {
    expect(findEntityLineInYaml(sampleYaml, 'NonExistentItem')).toBe(1);
    expect(findEntityLineInYaml('', 501)).toBe(1);
  });
});

describe('useYamlEditorStore', () => {
  beforeEach(() => {
    const state = useYamlEditorStore.getState();
    state.openFiles.forEach((f) => state.closeFile(f));
  });

  it('should open a file and track content', () => {
    const store = useYamlEditorStore.getState();
    store.openFile('db/re/item_db.yml', 'Header:\n  Type: ITEM_DB\n', 're_items');

    const updated = useYamlEditorStore.getState();
    expect(updated.openFiles).toContain('db/re/item_db.yml');
    expect(updated.activeFilePath).toBe('db/re/item_db.yml');
    expect(updated.files['db/re/item_db.yml']).toBeDefined();
    expect(updated.files['db/re/item_db.yml'].isDirty).toBe(false);
    expect(updated.files['db/re/item_db.yml'].totalLines).toBe(3);
  });

  it('should track dirty state when content is edited', () => {
    const store = useYamlEditorStore.getState();
    store.openFile('db/re/item_db.yml', 'Original Content', 're_items');

    store.updateFileContent('db/re/item_db.yml', 'Modified Content');
    let updated = useYamlEditorStore.getState();
    expect(updated.files['db/re/item_db.yml'].isDirty).toBe(true);
    expect(updated.files['db/re/item_db.yml'].currentContent).toBe('Modified Content');

    store.updateFileContent('db/re/item_db.yml', 'Original Content');
    updated = useYamlEditorStore.getState();
    expect(updated.files['db/re/item_db.yml'].isDirty).toBe(false);
  });

  it('should discard changes properly', () => {
    const store = useYamlEditorStore.getState();
    store.openFile('db/re/item_db.yml', 'Original Content', 're_items');
    store.updateFileContent('db/re/item_db.yml', 'Modified Content');

    store.discardChanges('db/re/item_db.yml');
    const updated = useYamlEditorStore.getState();
    expect(updated.files['db/re/item_db.yml'].isDirty).toBe(false);
    expect(updated.files['db/re/item_db.yml'].currentContent).toBe('Original Content');
  });

  it('should close files and select next active tab', () => {
    const store = useYamlEditorStore.getState();
    store.openFile('file1.yml', 'content1');
    store.openFile('file2.yml', 'content2');

    expect(useYamlEditorStore.getState().activeFilePath).toBe('file2.yml');

    store.closeFile('file2.yml');
    const updated = useYamlEditorStore.getState();
    expect(updated.openFiles).toEqual(['file1.yml']);
    expect(updated.activeFilePath).toBe('file1.yml');
    expect(updated.files['file2.yml']).toBeUndefined();
  });

  it('should open file at entity and compute target cursor line', () => {
    const sampleYaml = 'Header:\n  Type: ITEM_DB\nBody:\n  - Id: 501\n    AegisName: Red_Potion\n';
    const store = useYamlEditorStore.getState();
    store.openFileAtEntity('db/re/item_db.yml', 'Red_Potion', sampleYaml, 're_items');

    const updated = useYamlEditorStore.getState();
    expect(updated.activeFilePath).toBe('db/re/item_db.yml');
    expect(updated.cursorTarget).toEqual({ line: 5, column: 1 });
  });

  it('should discover layer content from DatabaseRegistry when calling openEntityInYamlEditor', () => {
    useDatabaseStore.getState().initializeWorkspace();
    const registry = useDatabaseStore.getState().registry;
    expect(registry).toBeDefined();

    openEntityInYamlEditor('db/re/item_db_usable.yml', 'Red_Potion', 're_item_db_usable');

    expect(useAppStore.getState().activeTab).toBe('editor');
    expect(useYamlEditorStore.getState().activeFilePath).toBe('db/re/item_db_usable.yml');
  });
});
