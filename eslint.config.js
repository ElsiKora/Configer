import { createConfig } from '@elsikora/eslint-config';

const baseConfig = {
  ignores: [
    'package-lock.json',
    'node_modules',
    'dist',
    'coverage',
    '.elsikora',
    '.github',
    '.husky',
    '*.md',
    '*.mdx',
  ],
};

export default [
  baseConfig,
  ...(await createConfig({
    withCheckFile: true,
    withJavascript: true,
    withJsDoc: true,
    withJson: true,
    withMarkdown: true,
    withNode: true,
    withNoSecrets: true,
    withPackageJson: true,
    withPerfectionist: true,
    withPrettier: true,
    withRegexp: true,
    withSonar: true,
    withStylistic: true,
    withTypescriptStrict: true,
    withUnicorn: true,
    withYaml: true,
  })),
];
