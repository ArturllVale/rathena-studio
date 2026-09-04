import { writeFile } from '@tauri-apps/plugin-fs';
import { join } from '@tauri-apps/api/path';

export interface FileContentWriter {
  writeFile(relativePath: string, content: string): Promise<void>;
}

export class TauriFileContentWriter implements FileContentWriter {
  constructor(private workspacePath: string) {}

  async writeFile(relativePath: string, content: string): Promise<void> {
    const fullPath = await join(this.workspacePath, relativePath);
    const encoder = new TextEncoder();
    const data = encoder.encode(content);
    await writeFile(fullPath, data);
  }
}

