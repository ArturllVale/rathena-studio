import { describe, it, expect } from 'vitest';
import { ItemEditSession } from '../src/domain/database/workspace/itemEditSession';
import { EffectiveItem, createEffectiveItem } from '../src/domain/database/item/effectiveItem';

describe('ItemEditSession', () => {
  const mockEffectiveItem: EffectiveItem = createEffectiveItem({
    id: 501,
    databaseVariant: 'RE',
    fields: { Id: 501, AegisName: 'Red_Potion', Name: 'Red Potion', Sell: 25, Weight: 70 },
    fieldOrigins: {},
    layerProvenance: ['item-db-base-root'],
    hasBuyPriceExplicit: false,
    hasSellPriceExplicit: true,
  });

  it('should initialize clean', () => {
    const session = new ItemEditSession(mockEffectiveItem);
    expect(session.isDirty).toBe(false);
    expect(session.getPendingChanges()).toEqual({});
    expect(session.getDiff()).toHaveLength(0);
    expect(session.canUndo).toBe(false);
    expect(session.canRedo).toBe(false);
  });

  it('should mark as dirty when a field changes and allow undo', () => {
    const session = new ItemEditSession(mockEffectiveItem);
    session.setField('Sell', 35);
    
    expect(session.isDirty).toBe(true);
    expect(session.getPendingChanges()).toEqual({ Sell: 35 });
    expect(session.canUndo).toBe(true);
    expect(session.canRedo).toBe(false);
    
    const diff = session.getDiff();
    expect(diff).toHaveLength(1);
    expect(diff[0]).toEqual({ field: 'Sell', original: 25, new: 35 });
    
    session.undo();
    
    expect(session.isDirty).toBe(false);
    expect(session.getPendingChanges()).toEqual({});
    expect(session.canUndo).toBe(false);
    expect(session.canRedo).toBe(true);
  });

  it('should allow redo after undo', () => {
    const session = new ItemEditSession(mockEffectiveItem);
    session.setField('Sell', 35);
    session.undo();
    
    expect(session.isDirty).toBe(false);
    
    session.redo();
    expect(session.isDirty).toBe(true);
    expect(session.getPendingChanges()).toEqual({ Sell: 35 });
    expect(session.canUndo).toBe(true);
    expect(session.canRedo).toBe(false);
  });

  it('should handle multiple fields (edit A, B, C; undo C, B, A)', () => {
    const session = new ItemEditSession(mockEffectiveItem);
    session.setField('Weight', 80);
    session.setField('Sell', 30);
    session.setField('Name', 'Blue Potion');
    
    expect(session.getPendingChanges()).toEqual({ Weight: 80, Sell: 30, Name: 'Blue Potion' });
    
    session.undo();
    expect(session.getPendingChanges()).toEqual({ Weight: 80, Sell: 30 });
    
    session.undo();
    expect(session.getPendingChanges()).toEqual({ Weight: 80 });
    
    session.undo();
    expect(session.getPendingChanges()).toEqual({});
    expect(session.isDirty).toBe(false);
  });

  it('should handle same field multiple times (70 -> 80 -> 90 -> 100)', () => {
    const session = new ItemEditSession(mockEffectiveItem);
    session.setField('Weight', 80);
    session.setField('Weight', 90);
    session.setField('Weight', 100);
    
    expect(session.getPendingChanges()).toEqual({ Weight: 100 });
    expect(session.getDiff()[0]).toEqual({ field: 'Weight', original: 70, new: 100 });
    
    session.undo();
    expect(session.getPendingChanges()).toEqual({ Weight: 90 });
    
    session.undo();
    expect(session.getPendingChanges()).toEqual({ Weight: 80 });
    
    session.undo();
    expect(session.getPendingChanges()).toEqual({});
    expect(session.isDirty).toBe(false);
  });

  it('should invalidate redo stack on new edit', () => {
    const session = new ItemEditSession(mockEffectiveItem);
    session.setField('Weight', 80);
    session.setField('Weight', 90);
    
    session.undo();
    expect(session.getPendingChanges()).toEqual({ Weight: 80 });
    expect(session.canRedo).toBe(true);
    
    session.setField('Weight', 100);
    expect(session.canRedo).toBe(false);
    
    session.undo();
    expect(session.getPendingChanges()).toEqual({ Weight: 80 });
  });

  it('should not push no-op edits to stack', () => {
    const session = new ItemEditSession(mockEffectiveItem);
    session.setField('Weight', 80);
    session.setField('Weight', 80); // Same as current
    
    session.undo();
    expect(session.getPendingChanges()).toEqual({});
  });

  it('should clone correctly with stacks preserved', () => {
    const session = new ItemEditSession(mockEffectiveItem);
    session.setField('Weight', 80);
    session.setField('Sell', 35);
    session.undo();
    
    const cloned = session.clone();
    expect(cloned.getPendingChanges()).toEqual({ Weight: 80 });
    expect(cloned.canUndo).toBe(true);
    expect(cloned.canRedo).toBe(true);
    
    cloned.redo();
    expect(cloned.getPendingChanges()).toEqual({ Weight: 80, Sell: 35 });
    
    cloned.undo();
    cloned.undo();
    expect(cloned.getPendingChanges()).toEqual({});
  });
});
