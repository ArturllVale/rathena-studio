/**
 * Tauri bridge utility to safely interact with Tauri 2 APIs.
 * Supports running in both desktop (Tauri) and web preview environments.
 */

export function isTauriEnvironment(): boolean {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
}

export async function invokeCommand<T = unknown>(cmd: string, args?: Record<string, unknown>): Promise<T> {
  if (isTauriEnvironment()) {
    const { invoke } = await import('@tauri-apps/api/core');
    return await invoke<T>(cmd, args);
  }
  
  // In pure web/dev preview mode without Tauri backend
  console.info(`[Tauri Mock Bridge] Command '${cmd}' invoked with:`, args);
  throw new Error(`Tauri environment not detected for command: ${cmd}`);
}

export async function openDirectoryDialog(title = 'Select rAthena Root Directory'): Promise<string | null> {
  if (isTauriEnvironment()) {
    try {
      const { open } = await import('@tauri-apps/plugin-dialog');
      const selected = await open({
        directory: true,
        multiple: false,
        title,
      });
      if (typeof selected === 'string') {
        return selected;
      }
      return null;
    } catch (err) {
      console.error('Failed to open directory dialog via Tauri plugin:', err);
      throw err;
    }
  }

  // Browser fallback prompt for local testing/dev
  if ('showDirectoryPicker' in window) {
    try {
      // @ts-ignore
      const dirHandle = await window.showDirectoryPicker();
      return `/[Web-Mock-Path]/${dirHandle.name}`;
    } catch (err) {
      console.warn('Browser directory picker cancelled or failed:', err);
      return null;
    }
  }

  const manual = window.prompt('Enter rAthena absolute path (Browser Dev Mode):');
  return manual && manual.trim().length > 0 ? manual.trim() : null;
}
