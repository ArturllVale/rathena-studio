import { useState } from 'react';
import { useAppStore, ActiveNavTab } from '@/stores/appStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { useDatabaseStore } from '@/stores/databaseStore';
import { ITEM_TYPES } from '@/domain/database/item/itemTypes';
import { 
  FolderKanban, 
  Database, 
  FileCode,
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
  { id: 'editor', label: 'YAML Editor', icon: FileCode },
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
        'bg-card border-r border-border/80 flex flex-col justify-between transition-all duration-200 select-none z-20',
        sidebarCollapsed ? 'w-18' : 'w-54'
      )}
    >
      <div className="flex flex-col py-3 gap-1.5 px-2">
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
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all w-full text-left',
                  isActive
                    ? 'bg-primary/15 text-primary border border-primary/25 shadow-2xs font-semibold'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent/70 border border-transparent'
                )}
                title={sidebarCollapsed ? item.label : undefined}
              >
                <Icon className={cn('h-4.5 w-4.5 shrink-0 transition-colors', isActive ? 'text-primary' : 'text-muted-foreground')} />
                {!sidebarCollapsed && <span className="truncate tracking-tight">{item.label}</span>}
              </button>
              
              {item.id === 'databases' && isDatabasesExpanded && isItemDbLoaded && !sidebarCollapsed && (
                <div className="flex flex-col gap-1 ml-5 border-l-2 border-border/60 pl-2.5 py-1.5">
                  <button
                    onClick={() => setItemFilters({ type: undefined, subType: undefined })}
                    className={cn(
                      'text-left text-xs px-2.5 py-1.5 rounded-md transition-colors',
                      !itemFilters.type
                        ? 'text-primary bg-primary/10 font-semibold'
                        : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                    )}
                  >
                    All Types
                  </button>
                  {ITEM_TYPES.map((type) => (
                    <button
                      key={type}
                      onClick={() => setItemFilters({ type, subType: undefined })}
                      className={cn(
                        'text-left text-xs px-2.5 py-1.5 rounded-md transition-colors',
                        itemFilters.type === type
                          ? 'text-primary bg-primary/10 font-semibold'
                          : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
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

      <div className="p-2 border-t border-border/70">
        <button
          onClick={toggleSidebar}
          className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-accent/70 transition-colors w-full text-left"
          title={sidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {sidebarCollapsed ? (
            <PanelLeft className="h-4 w-4 shrink-0 mx-auto" />
          ) : (
            <>
              <PanelLeftClose className="h-4 w-4 shrink-0" />
              <span className="text-xs">Collapse</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
