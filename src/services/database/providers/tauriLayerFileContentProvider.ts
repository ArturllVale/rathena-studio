import { LayerFileContentProvider } from '../databaseContextLoader';
import { readTextFile } from '@tauri-apps/plugin-fs';

export class TauriLayerFileContentProvider implements LayerFileContentProvider {
  constructor(private workspacePath: string) {}

  async readFile(relativePath: string): Promise<string> {
    try {
      // Normalize slashes and construct path directly to avoid missing path plugin issues
      const cleanRelative = relativePath.replace(/\\/g, '/').replace(/^\/+/, '');
      const cleanWorkspace = this.workspacePath.replace(/\\/g, '/').replace(/\/+$/, '');
      const fullPath = `${cleanWorkspace}/${cleanRelative}`;
      
      return await readTextFile(fullPath);
    } catch (e) {
      console.warn(`[Tauri File Provider] Failed to read ${relativePath}:`, e);
      // In Tauri, reading a non-existent file throws.
      // We return empty string as it's handled as 'does not exist / empty' by loader
      return '';
    }
  }
}
