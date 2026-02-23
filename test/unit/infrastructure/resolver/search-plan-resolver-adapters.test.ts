import { mkdir, mkdtemp, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { PackagePropertyPathNormalizerAdapter } from '@infrastructure/resolver/normalize-package-property-path.adapter';
import { SearchStartDirectoryResolverAdapter } from '@infrastructure/resolver/resolve-search-start-directory.adapter';
import { SearchStrategyResolverAdapter } from '@infrastructure/resolver/resolve-search-strategy.adapter';
import { describe, expect, it } from 'vitest';

const createTemporaryDirectory = async (): Promise<string> => {
  return mkdtemp(path.join(os.tmpdir(), 'configer-search-plan-resolvers-'));
};

describe('Search plan resolver adapters', () => {
  it('normalizes package property path from array/string/fallback', () => {
    const normalizerAdapter: PackagePropertyPathNormalizerAdapter =
      new PackagePropertyPathNormalizerAdapter();

    const normalizedFromArray: Array<string> = normalizerAdapter.execute(
      [' app ', '', 'nested'],
      'fallback',
    );

    const normalizedFromString: Array<string> = normalizerAdapter.execute(
      ' app . nested . value ',
      'fallback',
    );
    const normalizedFromFallback: Array<string> = normalizerAdapter.execute(undefined, 'fallback');

    expect(normalizedFromArray).toEqual(['app', 'nested']);
    expect(normalizedFromString).toEqual(['app', 'nested', 'value']);
    expect(normalizedFromFallback).toEqual(['fallback']);
  });

  it('resolves start directory for existing and non-existing file paths', async () => {
    const temporaryDirectory: string = await createTemporaryDirectory();
    const configDirectory: string = path.join(temporaryDirectory, 'config');
    const configFilepath: string = path.join(configDirectory, 'app.config.json');
    const missingFilepath: string = path.join(configDirectory, 'missing.config.json');
    const missingDirectoryPath: string = path.join(configDirectory, 'missing');

    await mkdir(configDirectory);
    await writeFile(configFilepath, '{"isEnabled":true}', 'utf8');

    const resolverAdapter: SearchStartDirectoryResolverAdapter =
      new SearchStartDirectoryResolverAdapter();
    const fromDirectory: string = resolverAdapter.execute(temporaryDirectory, configDirectory);
    const fromExistingFile: string = resolverAdapter.execute(temporaryDirectory, configFilepath);
    const fromMissingFile: string = resolverAdapter.execute(temporaryDirectory, missingFilepath);

    const fromMissingDirectory: string = resolverAdapter.execute(
      temporaryDirectory,
      missingDirectoryPath,
    );

    expect(fromDirectory).toBe(path.resolve(configDirectory));
    expect(fromExistingFile).toBe(path.resolve(configDirectory));
    expect(fromMissingFile).toBe(path.resolve(configDirectory));
    expect(fromMissingDirectory).toBe(path.resolve(missingDirectoryPath));
  });

  it('resolves search strategy using explicit value and defaults', () => {
    const resolverAdapter: SearchStrategyResolverAdapter = new SearchStrategyResolverAdapter();
    const explicitStopDirectory: string | undefined = undefined;
    const missingStrategy: undefined = undefined;
    const missingStopDirectory: string | undefined = undefined;
    const explicitStrategy: string = resolverAdapter.execute('project', explicitStopDirectory);
    const defaultGlobalStrategy: string = resolverAdapter.execute(missingStrategy, '/safe/stop');

    const defaultNoneStrategy: string = resolverAdapter.execute(
      missingStrategy,
      missingStopDirectory,
    );

    expect(explicitStrategy).toBe('project');
    expect(defaultGlobalStrategy).toBe('global');
    expect(defaultNoneStrategy).toBe('none');
  });
});
