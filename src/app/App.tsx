import { useEffect } from 'react';
import { useAppStore } from '@/stores/appStore';
import { isTauriEnvironment } from '@/services/tauriBridge';
import { TitleBar } from '@/components/layout/TitleBar';
import { Sidebar } from '@/components/layout/Sidebar';
import { StatusBar } from '@/components/layout/StatusBar';
import { ErrorBoundary } from '@/components/layout/ErrorBoundary';
import { WorkspaceLandingView } from '@/features/workspace/WorkspaceLandingView';
import { DatabasesView } from '@/features/databases/DatabasesView';
import { ProcessesView } from '@/features/processes/ProcessesView';
import { LogsView } from '@/features/logs/LogsView';
import { SettingsView } from '@/features/settings/SettingsView';

export function App() {
  const activeTab = useAppStore((s) => s.activeTab);
  const setIsTauri = useAppStore((s) => s.setIsTauri);

  useEffect(() => {
    setIsTauri(isTauriEnvironment());
  }, [setIsTauri]);

  const renderContent = () => {
    switch (activeTab) {
      case 'workspace':
        return <WorkspaceLandingView />;
      case 'databases':
        return <DatabasesView />;
      case 'processes':
        return <ProcessesView />;
      case 'logs':
        return <LogsView />;
      case 'settings':
        return <SettingsView />;
      default:
        return <WorkspaceLandingView />;
    }
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-[#18181b] text-neutral-100 overflow-hidden font-sans">
      <TitleBar />
      <div className="flex-1 flex overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-hidden relative">
          <ErrorBoundary>
            {renderContent()}
          </ErrorBoundary>
        </main>
      </div>
      <StatusBar />
    </div>
  );
}
export default App;
