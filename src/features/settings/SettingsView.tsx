import { useState } from 'react';
import { useSettingsStore } from '@/stores/settingsStore';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Settings, Save, Check } from 'lucide-react';

export function SettingsView() {
  const { settings, updateSettings } = useSettingsStore();

  const [mysqlHost, setMysqlHost] = useState(settings.serverRuntime.mysqlHost || '127.0.0.1');
  const [mysqlPort, setMysqlPort] = useState(settings.serverRuntime.mysqlPort || 3306);
  const [mysqlDb, setMysqlDb] = useState(settings.serverRuntime.mysqlDatabase || 'ragnarok');
  const [mysqlUser, setMysqlUser] = useState(settings.serverRuntime.mysqlUser || 'ragnarok');
  const [loginExe, setLoginExe] = useState(settings.serverRuntime.loginServerExecutable || '');
  const [charExe, setCharExe] = useState(settings.serverRuntime.charServerExecutable || '');
  const [mapExe, setMapExe] = useState(settings.serverRuntime.mapServerExecutable || '');

  const [isSaved, setIsSaved] = useState(false);

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
    <div className="h-full w-full p-6 overflow-auto bg-[#18181b] flex justify-center">
      <div className="max-w-3xl w-full space-y-6">
        <div className="flex items-center justify-between pb-2 border-b border-[#27272a]">
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-neutral-400" />
            <div>
              <h2 className="text-base font-semibold text-neutral-100">Application Settings</h2>
              <p className="text-xs text-neutral-400">Manage runtime environment, paths, and database links.</p>
            </div>
          </div>
          {isSaved && (
            <Badge variant="success" className="gap-1 font-mono text-[10px]">
              <Check className="h-3 w-3" /> Saved
            </Badge>
          )}
        </div>

        {/* Database Connectivity */}
        <Card className="bg-[#1f1f23] border-[#27272a]">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">MySQL / MariaDB Connection</CardTitle>
            <CardDescription className="text-xs">
              Configure parameters for the rAthena database server.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-mono text-neutral-300">Host</label>
                <Input
                  value={mysqlHost}
                  onChange={(e) => setMysqlHost(e.target.value)}
                  placeholder="127.0.0.1"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-mono text-neutral-300">Port</label>
                <Input
                  type="number"
                  value={mysqlPort}
                  onChange={(e) => setMysqlPort(Number(e.target.value))}
                  placeholder="3306"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-mono text-neutral-300">Database Name</label>
                <Input
                  value={mysqlDb}
                  onChange={(e) => setMysqlDb(e.target.value)}
                  placeholder="ragnarok"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-mono text-neutral-300">User</label>
                <Input
                  value={mysqlUser}
                  onChange={(e) => setMysqlUser(e.target.value)}
                  placeholder="ragnarok"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Server Binary Overrides */}
        <Card className="bg-[#1f1f23] border-[#27272a]">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Server Binary Overrides</CardTitle>
            <CardDescription className="text-xs">
              Optional custom paths for login-server, char-server, and map-server binaries.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-mono text-neutral-300">Login Server Executable</label>
              <Input
                value={loginExe}
                onChange={(e) => setLoginExe(e.target.value)}
                placeholder="Default: <root>/login-server.exe"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-mono text-neutral-300">Char Server Executable</label>
              <Input
                value={charExe}
                onChange={(e) => setCharExe(e.target.value)}
                placeholder="Default: <root>/char-server.exe"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-mono text-neutral-300">Map Server Executable</label>
              <Input
                value={mapExe}
                onChange={(e) => setMapExe(e.target.value)}
                placeholder="Default: <root>/map-server.exe"
              />
            </div>
          </CardContent>
          <CardFooter className="pt-2 border-t border-[#27272a] flex justify-end">
            <Button variant="default" size="sm" onClick={handleSave} className="gap-1.5 text-xs bg-sky-600 hover:bg-sky-500 text-white">
              <Save className="h-3.5 w-3.5" />
              Save Configuration
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
