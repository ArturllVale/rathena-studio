import { watch, UnwatchFn } from '@tauri-apps/plugin-fs';

export type FileChangeCallback = (filePath: string) => void;

export class WorkspaceWatcherService {
  private unwatchFn: UnwatchFn | null = null;
  private onFileChangeCallback: FileChangeCallback | null = null;

  public onFileChange(callback: FileChangeCallback) {
    this.onFileChangeCallback = callback;
  }

  public async startWatching(workspacePath: string) {
    await this.stopWatching();

    try {
      this.unwatchFn = await watch(
        workspacePath,
        (event) => {
          // Normaliza caminhos e checa se é evento relevante
          const isModify =
            event.type === 'any' ||
            (typeof event.type === 'object' && ('modify' in event.type || 'create' in event.type));
            
          if (isModify && event.paths && event.paths.length > 0) {
            event.paths.forEach((path) => {
              if (path.endsWith('.yml') || path.endsWith('.yaml') || path.endsWith('.conf')) {
                const normalizedPath = path.replace(/\\/g, '/');
                if (this.onFileChangeCallback) {
                  this.onFileChangeCallback(normalizedPath);
                }
              }
            });
          }
        },
        { recursive: true, delayMs: 500 }
      );
    } catch (err) {
      console.error('[WorkspaceWatcher] Falha ao iniciar file watcher:', err);
    }
  }

  public async stopWatching() {
    if (this.unwatchFn) {
      try {
        this.unwatchFn();
      } catch (err) {
        console.warn('[WorkspaceWatcher] Erro ao parar watcher:', err);
      } finally {
        this.unwatchFn = null;
      }
    }
  }
}

export const workspaceWatcher = new WorkspaceWatcherService();
