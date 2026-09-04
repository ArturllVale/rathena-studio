import { useState } from 'react';
import { useSettingsStore } from '@/stores/settingsStore';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Settings, Save, Check, Sun, Moon, Monitor, Palette, Database, Server } from 'lucide-react';

export function SettingsView() {
  const { settings, updateSettings, setTheme } = useSettingsStore();

  const [mysqlHost, setMysqlHost] = useState(settings.serverRuntime.mysqlHost || '127.0.0.1');
  const [mysqlPort, setMysqlPort] = useState(settings.serverRuntime.mysqlPort || 3306);
  const [mysqlDb, setMysqlDb] = useState(settings.serverRuntime.mysqlDatabase || 'ragnarok');
  const [mysqlUser, setMysqlUser] = useState(settings.serverRuntime.mysqlUser || 'ragnarok');
  const [loginExe, setLoginExe] = useState(settings.serverRuntime.loginServerExecutable || '');
  const [charExe, setCharExe] = useState(settings.serverRuntime.charServerExecutable || '');
  const [mapExe, setMapExe] = useState(settings.serverRuntime.mapServerExecutable || '');

  const [isSaved, setIsSaved] = useState(false);

  const currentTheme = settings.ui.theme;

  const handleSave = () => {
    updateSettings((prev) => ({
      ...prev,
      serverRuntime: {
        ...prev.serverRuntime,
        mysqlHost,
        mysqlPort: Number(mysqlPort),
        mysqlDatabase: mysqlDb,
        mysqlUser,
        loginServerExecutable: loginExe || undefined,
        charServerExecutable: charExe || undefined,
        mapServerExecutable: mapExe || undefined,
      },
    }));
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  return (
    <div className="h-full w-full p-6 lg:p-10 overflow-auto bg-background text-foreground flex justify-center">
      <div className="max-w-3xl w-full space-y-8">
        <div className="flex items-center justify-between pb-4 border-b border-border/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-pastel-blue/15 border border-pastel-blue/30 shadow-2xs">
              <Settings className="h-6 w-6 text-pastel-blue" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-foreground">Application Settings</h2>
              <p className="text-xs text-muted-foreground font-mono">Manage UI ergonomics, runtime environment, and database links.</p>
            </div>
          </div>
          {isSaved && (
            <Badge variant="success" className="gap-1.5 font-mono text-xs px-3 py-1">
              <Check className="h-3.5 w-3.5" /> Saved Successfully
            </Badge>
          )}
        </div>

        {/* Appearance & Ergonomics Card */}
        <Card className="border-border/80 shadow-xs rounded-2xl">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2.5">
              <Palette className="h-5 w-5 text-pastel-blue" />
              <CardTitle className="text-base font-semibold">Appearance &amp; Visual Ergonomics</CardTitle>
            </div>
            <CardDescription className="text-xs text-muted-foreground">
              Customize the color theme and interface density for comfortable long sessions.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-2.5">
                Color Palette &amp; Theme
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setTheme('light')}
                  className={`flex flex-col items-center justify-center p-4 rounded-xl border text-center transition-all shadow-2xs ${
                    currentTheme === 'light'
                      ? 'border-pastel-blue bg-pastel-blue/15 ring-2 ring-pastel-blue/30 text-foreground font-semibold'
                      : 'border-border/80 bg-card hover:bg-accent/40 text-muted-foreground'
                  }`}
                >
                  <Sun className="h-6 w-6 text-amber-500 mb-2" />
                  <span className="text-xs font-semibold">Warm Light</span>
                  <span className="text-[10px] text-muted-foreground mt-0.5">High clarity &amp; soft pastel tones</span>
                </button>

                <button
                  type="button"
                  onClick={() => setTheme('dark')}
                  className={`flex flex-col items-center justify-center p-4 rounded-xl border text-center transition-all shadow-2xs ${
                    currentTheme === 'dark'
                      ? 'border-pastel-blue bg-pastel-blue/15 ring-2 ring-pastel-blue/30 text-foreground font-semibold'
                      : 'border-border/80 bg-card hover:bg-accent/40 text-muted-foreground'
                  }`}
                >
                  <Moon className="h-6 w-6 text-pastel-blue mb-2" />
                  <span className="text-xs font-semibold">Velvet Charcoal</span>
                  <span className="text-[10px] text-muted-foreground mt-0.5">Reduced glare for dark setups</span>
                </button>

                <button
                  type="button"
                  onClick={() => setTheme('system')}
                  className={`flex flex-col items-center justify-center p-4 rounded-xl border text-center transition-all shadow-2xs ${
                    currentTheme === 'system'
                      ? 'border-pastel-blue bg-pastel-blue/15 ring-2 ring-pastel-blue/30 text-foreground font-semibold'
                      : 'border-border/80 bg-card hover:bg-accent/40 text-muted-foreground'
                  }`}
                >
                  <Monitor className="h-6 w-6 text-mint mb-2" />
                  <span className="text-xs font-semibold">System Sync</span>
                  <span className="text-[10px] text-muted-foreground mt-0.5">Follows OS dark mode setting</span>
                </button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Database Connectivity */}
        <Card className="border-border/80 shadow-xs rounded-2xl">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2.5">
              <Database className="h-5 w-5 text-mint" />
              <CardTitle className="text-base font-semibold">MySQL / MariaDB Connection</CardTitle>
            </div>
            <CardDescription className="text-xs text-muted-foreground">
              Configure parameters for the rAthena database server.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-mono font-medium text-foreground">Host</label>
                <Input
                  value={mysqlHost}
                  onChange={(e) => setMysqlHost(e.target.value)}
                  placeholder="127.0.0.1"
                  className="font-mono text-xs"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-mono font-medium text-foreground">Port</label>
                <Input
                  type="number"
                  value={mysqlPort}
                  onChange={(e) => setMysqlPort(Number(e.target.value))}
                  placeholder="3306"
                  className="font-mono text-xs"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-mono font-medium text-foreground">Database Name</label>
                <Input
                  value={mysqlDb}
                  onChange={(e) => setMysqlDb(e.target.value)}
                  placeholder="ragnarok"
                  className="font-mono text-xs"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-mono font-medium text-foreground">User</label>
                <Input
                  value={mysqlUser}
                  onChange={(e) => setMysqlUser(e.target.value)}
                  placeholder="ragnarok"
                  className="font-mono text-xs"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Server Binary Overrides */}
        <Card className="border-border/80 shadow-xs rounded-2xl">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2.5">
              <Server className="h-5 w-5 text-lavender" />
              <CardTitle className="text-base font-semibold">Server Binary Overrides</CardTitle>
            </div>
            <CardDescription className="text-xs text-muted-foreground">
              Optional custom paths for login-server, char-server, and map-server binaries.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-mono font-medium text-foreground">Login Server Executable</label>
              <Input
                value={loginExe}
                onChange={(e) => setLoginExe(e.target.value)}
                placeholder="Default: <root>/login-server.exe"
                className="font-mono text-xs"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-mono font-medium text-foreground">Char Server Executable</label>
              <Input
                value={charExe}
                onChange={(e) => setCharExe(e.target.value)}
                placeholder="Default: <root>/char-server.exe"
                className="font-mono text-xs"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-mono font-medium text-foreground">Map Server Executable</label>
              <Input
                value={mapExe}
                onChange={(e) => setMapExe(e.target.value)}
                placeholder="Default: <root>/map-server.exe"
                className="font-mono text-xs"
              />
            </div>
          </CardContent>
          <CardFooter className="pt-3 border-t border-border/80 flex justify-end">
            <Button variant="default" size="default" onClick={handleSave} className="gap-2 text-xs font-semibold">
              <Save className="h-4 w-4" />
              Save Configuration
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
