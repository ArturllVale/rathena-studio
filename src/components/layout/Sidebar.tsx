import { useAppStore, ActiveNavTab } from '@/stores/appStore';
import { useSettingsStore } from '@/stores/settingsStore';
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
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
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
