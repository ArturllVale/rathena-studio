import { LayerFileContentProvider } from '../databaseContextLoader';
import { readTextFile } from '@tauri-apps/plugin-fs';
import { join } from '@tauri-apps/api/path';

export class TauriLayerFileContentProvider implements LayerFileContentProvider {
  constructor(private workspacePath: string) {}

  async readFile(relativePath: string): Promise<string> {
    try {
      const fullPath = await join(this.workspacePath, relativePath);
      return await readTextFile(fullPath);
    } catch (e) {
      // In Tauri, reading a non-existent file throws.
      // We return empty string as it's handled as 'does not exist / empty' by loader
      return '';
    }
  }
}
