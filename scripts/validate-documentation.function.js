import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const FILE_PATH = fileURLToPath(import.meta.url);
const DIR_PATH = path.dirname(FILE_PATH);
const ROOT_PATH = path.resolve(DIR_PATH, '..');

const REQUIRED_DOC_FILES = [
  'docs/page.mdx',
  'docs/_meta.js',
  'docs/getting-started/page.mdx',
  'docs/getting-started/_meta.js',
  'docs/core-concepts/page.mdx',
  'docs/core-concepts/_meta.js',
  'docs/guides/page.mdx',
  'docs/guides/_meta.js',
  'docs/api-reference/page.mdx',
  'docs/api-reference/_meta.js',
];

const missingFiles = REQUIRED_DOC_FILES.filter((relativePath) => {
  const absolutePath = path.join(ROOT_PATH, relativePath);

  return !existsSync(absolutePath);
});

if (missingFiles.length > 0) {
  throw new Error(
    `Docs validation failed. Missing required docs files:\n${missingFiles.join('\n')}`,
  );
}

if (!existsSync(path.join(ROOT_PATH, 'README.md'))) {
  throw new Error('Docs validation failed. README.md is required.');
}

console.warn('Docs validation passed.');
