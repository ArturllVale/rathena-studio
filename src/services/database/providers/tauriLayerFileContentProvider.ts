import { LayerFileContentProvider } from '../databaseContextLoader';
import { readFile as tauriReadFile } from '@tauri-apps/plugin-fs';

export class TauriLayerFileContentProvider implements LayerFileContentProvider {
  constructor(private workspacePath: string) {}

  async readFile(relativePath: string): Promise<string> {
    try {
      // Normalize slashes and construct path directly to avoid missing path plugin issues
      const cleanRelative = relativePath.replace(/\\/g, '/').replace(/^\/+/, '');
      const cleanWorkspace = this.workspacePath.replace(/\\/g, '/').replace(/\/+$/, '');
      const fullPath = `${cleanWorkspace}/${cleanRelative}`;
      
      const bytes = await tauriReadFile(fullPath);
      
      try {
        // Try UTF-8 first (strict)
        const utf8Decoder = new TextDecoder('utf-8', { fatal: true });
        return utf8Decoder.decode(bytes);
      } catch (e) {
        // Fallback to Windows-1252 for legacy rAthena files
        const win1252Decoder = new TextDecoder('windows-1252');
        return win1252Decoder.decode(bytes);
      }
    } catch (e) {
      console.warn(`[Tauri File Provider] Failed to read ${relativePath}:`, e);
      // In Tauri, reading a non-existent file throws.
      // We return empty string as it's handled as 'does not exist / empty' by loader
      return '';
    }
  }
}
