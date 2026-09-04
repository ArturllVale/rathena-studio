import { useWorkspaceStore } from '@/stores/workspaceStore';
import { useAppStore } from '@/stores/appStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { FolderGit2, HardDrive, ShieldCheck, ShieldAlert, Sun, Moon, Monitor } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export function TitleBar() {
  const activeWorkspace = useWorkspaceStore((s) => s.activeWorkspace);
  const isTauri = useAppStore((s) => s.isTauri);
  const theme = useSettingsStore((s) => s.settings.ui.theme);
  const setTheme = useSettingsStore((s) => s.setTheme);

  const toggleNextTheme = () => {
    if (theme === 'dark') setTheme('light');
    else if (theme === 'light') setTheme('system');
    else setTheme('dark');
  };

  return (
    <header className="h-11 w-full bg-card/95 backdrop-blur border-b border-border/80 flex items-center justify-between px-4 text-xs select-none z-30 transition-colors">
      {/* App branding & Identity */}
      <div className="flex items-center gap-3 font-medium">
        <div className="flex items-center gap-2 text-foreground">
          <div className="p-1 rounded-md bg-primary/12 text-primary">
            <FolderGit2 className="h-4 w-4" />
          </div>
          <span className="font-semibold text-sm tracking-tight text-foreground">rAthena Studio</span>
          <span className="text-xs text-muted-foreground font-mono">v0.1.0</span>
        </div>

        <div className="h-4 w-px bg-border/80" />

        {/* Workspace indicator */}
        <div className="flex items-center gap-2 text-muted-foreground">
          <HardDrive className="h-3.5 w-3.5" />
          {activeWorkspace ? (
            <div className="flex items-center gap-2">
              <span className="text-foreground font-medium text-xs font-mono">{activeWorkspace.name}</span>
              <span className="text-xs text-muted-foreground truncate max-w-sm font-mono opacity-80">({activeWorkspace.rootPath})</span>
            </div>
          ) : (
            <span className="italic text-muted-foreground">No workspace open</span>
          )}
        </div>
      </div>

      {/* Right controls / Theme Switcher & Environment Badge */}
      <div className="flex items-center gap-2.5">
        {/* Quick Theme Toggle */}
        <button
          onClick={toggleNextTheme}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-border/60 bg-secondary/60 hover:bg-secondary text-secondary-foreground text-xs font-medium transition-colors shadow-2xs"
          title={`Current theme: ${theme}. Click to change.`}
        >
          {theme === 'dark' && <Moon className="h-3.5 w-3.5 text-pastel-lavender" />}
          {theme === 'light' && <Sun className="h-3.5 w-3.5 text-pastel-peach" />}
          {theme === 'system' && <Monitor className="h-3.5 w-3.5 text-pastel-blue" />}
          <span className="capitalize text-xs">{theme}</span>
        </button>

        {isTauri ? (
          <Badge variant="success" className="gap-1.5 font-mono text-xs py-1 px-2.5">
            <ShieldCheck className="h-3.5 w-3.5" />
            Tauri 2 Native
          </Badge>
        ) : (
          <Badge variant="warning" className="gap-1.5 font-mono text-xs py-1 px-2.5">
            <ShieldAlert className="h-3.5 w-3.5" />
            Web Mode
          </Badge>
        )}
      </div>
    </header>
  );
}
