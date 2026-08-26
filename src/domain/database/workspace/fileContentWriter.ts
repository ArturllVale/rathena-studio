import { writeTextFile } from '@tauri-apps/plugin-fs';
import { join } from '@tauri-apps/api/path';

export interface FileContentWriter {
  writeFile(relativePath: string, content: string): Promise<void>;
}

/**
 * Tauri implementation for writing files.
 * 
 * ATOMICITY TECHNICAL DEBT:
 * - Session Atomicity: The application state guarantees atomicity. If a write fails,
 *   the UI session remains dirty and no data is lost in the editor.
 * - Filesystem Atomicity: `writeTextFile` is a standard OS file overwrite. It is NOT
 *   guaranteed to be atomic (write-to-temp + rename) across all platforms. 
 *   A sudden power failure during the write could potentially leave the YAML file 
 *   partially written or corrupted.
 * 
 * TODO: Implement a true atomic writer (e.g. write to `filename.tmp` -> OS rename)
 * either here via Tauri custom command or wait for Tauri to support atomic writes natively.
 */
export class TauriFileContentWriter implements FileContentWriter {
  constructor(private workspacePath: string) {}

  async writeFile(relativePath: string, content: string): Promise<void> {
    const fullPath = await join(this.workspacePath, relativePath);
    await writeTextFile(fullPath, content);
  }
}
