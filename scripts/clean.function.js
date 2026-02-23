import { existsSync, rmSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const FILE_PATH = fileURLToPath(import.meta.url);
const DIR_PATH = path.dirname(FILE_PATH);
const ROOT_PATH = path.resolve(DIR_PATH, '..');

const TARGETS = ['dist', 'coverage'];

for (const targetPath of TARGETS) {
  const absolutePath = path.join(ROOT_PATH, targetPath);

  if (existsSync(absolutePath)) {
    rmSync(absolutePath, { force: true, recursive: true });
  }
}
