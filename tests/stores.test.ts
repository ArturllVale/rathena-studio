import { describe, it, expect, beforeEach } from 'vitest';
import { useWorkspaceStore } from '@/stores/workspaceStore';
import { useAppStore } from '@/stores/appStore';
import { useSettingsStore } from '@/stores/settingsStore';

describe('Zustand Stores', () => {
  beforeEach(() => {
    useWorkspaceStore.getState().closeWorkspace();
    useAppStore.getState().setActiveTab('workspace');
  });

  it('updates app active tab', () => {
    expect(useAppStore.getState().activeTab).toBe('workspace');
    useAppStore.getState().setActiveTab('settings');
    expect(useAppStore.getState().activeTab).toBe('settings');
  });

  it('manages app notifications', () => {
    useAppStore.getState().addNotification('info', 'Test notification');
    const notifs = useAppStore.getState().notifications;
    expect(notifs.length).toBe(1);
    expect(notifs[0].message).toBe('Test notification');

    useAppStore.getState().dismissNotification(notifs[0].id);
    expect(useAppStore.getState().notifications.length).toBe(0);
  });

  it('sets workspace from path and clears it on close', async () => {
    await useWorkspaceStore.getState().setWorkspaceFromPath('C:/mock/rathena');
    expect(useWorkspaceStore.getState().activeWorkspace).not.toBeNull();
    expect(useWorkspaceStore.getState().activeWorkspace?.name).toBe('rathena');

    useWorkspaceStore.getState().closeWorkspace();
    expect(useWorkspaceStore.getState().activeWorkspace).toBeNull();
  });

  it('updates settings and sidebar collapsed state', () => {
    const initialCollapsed = useSettingsStore.getState().settings.ui.sidebarCollapsed;
    useSettingsStore.getState().toggleSidebar();
    expect(useSettingsStore.getState().settings.ui.sidebarCollapsed).toBe(!initialCollapsed);
  });
});
