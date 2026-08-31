import { useEffect } from 'react';
import { useAppStore } from '@/stores/appStore';
import { isTauriEnvironment } from '@/services/tauriBridge';
import { TitleBar } from '@/components/layout/TitleBar';
import { Sidebar } from '@/components/layout/Sidebar';
import { StatusBar } from '@/components/layout/StatusBar';
import { ErrorBoundary } from '@/components/layout/ErrorBoundary';
import { WorkspaceLandingView } from '@/features/workspace/WorkspaceLandingView';
import { DatabasesView } from '@/features/databases/DatabasesView';
import { DatabaseYamlEditorView } from '@/features/editor/DatabaseYamlEditorView';
import { ProcessesView } from '@/features/processes/ProcessesView';
import { LogsView } from '@/features/logs/LogsView';
import { SettingsView } from '@/features/settings/SettingsView';

export function App() {
  const activeTab = useAppStore((s) => s.activeTab);
  const setIsTauri = useAppStore((s) => s.setIsTauri);

  useEffect(() => {
    setIsTauri(isTauriEnvironment());
  }, [setIsTauri]);

  return (
    <div className="h-screen w-screen flex flex-col bg-[#18181b] text-neutral-100 overflow-hidden font-sans">
      <TitleBar />
      <div className="flex-1 flex overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-hidden relative">
          <ErrorBoundary>
            <div className={activeTab === 'workspace' ? 'h-full w-full' : 'hidden'}>
              <WorkspaceLandingView />
            </div>
            <div className={activeTab === 'databases' ? 'h-full w-full' : 'hidden'}>
              <DatabasesView />
            </div>
            <div className={activeTab === 'editor' ? 'h-full w-full' : 'hidden'}>
              <DatabaseYamlEditorView />
            </div>
            <div className={activeTab === 'processes' ? 'h-full w-full' : 'hidden'}>
              <ProcessesView />
            </div>
            <div className={activeTab === 'logs' ? 'h-full w-full' : 'hidden'}>
              <LogsView />
            </div>
            <div className={activeTab === 'settings' ? 'h-full w-full' : 'hidden'}>
              <SettingsView />
            </div>
          </ErrorBoundary>
        </main>
      </div>
      <StatusBar />
    </div>
  );
}

export default App;
