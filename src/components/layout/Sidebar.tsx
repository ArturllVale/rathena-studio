import { useState } from 'react';
import { useAppStore, ActiveNavTab } from '@/stores/appStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { useDatabaseStore } from '@/stores/databaseStore';
import { ITEM_TYPES } from '@/domain/database/item/itemTypes';
import { 
  FolderKanban, 
  Database, 
  Cpu, 
  Terminal, 
  Settings,
  PanelLeftClose,
  PanelLeft
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  id: ActiveNavTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  disabled?: boolean;
}

const navItems: NavItem[] = [
  { id: 'workspace', label: 'Workspace', icon: FolderKanban },
  { id: 'databases', label: 'Databases', icon: Database },
  { id: 'processes', label: 'Processes', icon: Cpu },
  { id: 'logs', label: 'Log Center', icon: Terminal },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export function Sidebar() {
  const activeTab = useAppStore((s) => s.activeTab);
  const setActiveTab = useAppStore((s) => s.setActiveTab);
  const sidebarCollapsed = useSettingsStore((s) => s.settings.ui.sidebarCollapsed);
  const toggleSidebar = useSettingsStore((s) => s.toggleSidebar);

  const [isDatabasesExpanded, setIsDatabasesExpanded] = useState(false);
  const metadataMap = useDatabaseStore((s) => s.metadataMap);
  const itemFilters = useDatabaseStore((s) => s.itemFilters);
  const setItemFilters = useDatabaseStore((s) => s.setItemFilters);

  const itemMeta = metadataMap['item'];
  const isItemDbLoaded = itemMeta?.state === 'loaded';

  return (
    <aside
      className={cn(
        'bg-[#141416] border-r border-[#27272a] flex flex-col justify-between transition-all duration-200 select-none z-20',
        sidebarCollapsed ? 'w-12' : 'w-48'
      )}
    >
      <div className="flex flex-col py-2 gap-1 px-1.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <div key={item.id} className="flex flex-col gap-1 w-full">
              <button
                onClick={() => {
                  if (item.id === 'databases') {
                    if (isActive) {
                      setIsDatabasesExpanded(!isDatabasesExpanded);
                    } else {
                      setActiveTab(item.id);
                      setIsDatabasesExpanded(true);
                    }
                  } else {
                    setActiveTab(item.id);
                  }
                }}
                className={cn(
                  'flex items-center gap-2.5 px-2.5 py-2 rounded-md text-xs font-medium transition-colors w-full text-left',
                  isActive
                    ? 'bg-sky-600/15 text-sky-400 border border-sky-500/30'
                    : 'text-neutral-400 hover:text-neutral-200 hover:bg-[#1f1f23] border border-transparent'
                )}
                title={sidebarCollapsed ? item.label : undefined}
              >
                <Icon className={cn('h-4 w-4 shrink-0', isActive ? 'text-sky-400' : 'text-neutral-400')} />
                {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
              </button>
              
              {item.id === 'databases' && isDatabasesExpanded && isItemDbLoaded && !sidebarCollapsed && (
                <div className="flex flex-col gap-0.5 ml-6 border-l border-[#27272a] pl-2 py-1">
                  <button
                    onClick={() => setItemFilters({ type: undefined, subType: undefined })}
                    className={cn(
                      'text-left text-[11px] px-2 py-1.5 rounded transition-colors',
                      !itemFilters.type
                        ? 'text-sky-400 bg-sky-500/10'
                        : 'text-neutral-400 hover:text-neutral-200 hover:bg-[#1f1f23]'
                    )}
                  >
                    All Types
                  </button>
                  {ITEM_TYPES.map((type) => (
                    <button
                      key={type}
                      onClick={() => setItemFilters({ type, subType: undefined })}
                      className={cn(
                        'text-left text-[11px] px-2 py-1.5 rounded transition-colors',
                        itemFilters.type === type
                          ? 'text-sky-400 bg-sky-500/10'
                          : 'text-neutral-400 hover:text-neutral-200 hover:bg-[#1f1f23]'
                      )}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="p-1.5 border-t border-[#27272a]">
        <button
          onClick={toggleSidebar}
          className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-xs font-medium text-neutral-500 hover:text-neutral-300 hover:bg-[#1f1f23] transition-colors w-full text-left"
          title={sidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {sidebarCollapsed ? (
            <PanelLeft className="h-4 w-4 shrink-0" />
          ) : (
            <>
              <PanelLeftClose className="h-4 w-4 shrink-0" />
              <span className="text-[11px]">Collapse</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
