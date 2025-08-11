import fs from 'fs';
import path from 'path';

export function loadFile(filePath: string): string {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Error loading file ${filePath}: ${message}`);
  }
}

export function saveFile(filePath: string, content: string): void {
  try {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filePath, content);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Error saving file ${filePath}: ${message}`);
  }
}


