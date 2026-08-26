import { describe, it, expect, beforeEach } from 'vitest';
import { useDatabaseStore } from '../src/stores/databaseStore';

describe('Item Explorer UI State', () => {
  beforeEach(() => {
    useDatabaseStore.getState().clearWorkspace();
  });

  it('should initialize with empty filters and no selected item', () => {
    const state = useDatabaseStore.getState();
    expect(state.selectedItemId).toBeNull();
    expect(state.itemFilters).toEqual({ query: '' });
  });

  it('should set selected item id', () => {
    useDatabaseStore.getState().setSelectedItemId(501);
    expect(useDatabaseStore.getState().selectedItemId).toBe(501);
  });

  it('should set item filters and clear selected item', () => {
    useDatabaseStore.getState().setSelectedItemId(501);
    
    useDatabaseStore.getState().setItemFilters({ query: 'red' });
    expect(useDatabaseStore.getState().itemFilters.query).toBe('red');
    // setting filter should clear selection
    expect(useDatabaseStore.getState().selectedItemId).toBeNull();
    
    useDatabaseStore.getState().setItemFilters({ type: 'Weapon', subType: 'Dagger' });
    expect(useDatabaseStore.getState().itemFilters).toEqual({
      query: 'red',
      type: 'Weapon',
      subType: 'Dagger'
    });
  });

  it('should clear selection when variant is changed', () => {
    useDatabaseStore.getState().setSelectedItemId(501);
    useDatabaseStore.getState().setVariant('PRE_RE');
    
    expect(useDatabaseStore.getState().activeVariant).toBe('PRE_RE');
    expect(useDatabaseStore.getState().selectedItemId).toBeNull();
  });
});
