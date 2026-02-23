import type { IConfigClientSync } from '@domain/entity/config-client-sync.entity';
import type { IConfigClient } from '@domain/entity/config-client.entity';
import type { IConfigResult } from '@domain/entity/config-result.entity';

import { mkdtemp, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { createConfiger, createConfigerSync } from '@src/index';
import { describe, expect, it } from 'vitest';

const DECIMAL_RADIX: number = '0123456789'.length;
const VALUE_ONE: number = Number.parseInt('1', DECIMAL_RADIX);
const VALUE_TWO: number = Number.parseInt('2', DECIMAL_RADIX);
const VALUE_THREE: number = Number.parseInt('3', DECIMAL_RADIX);

const createTemporaryDirectory = async (): Promise<string> => {
  return mkdtemp(path.join(os.tmpdir(), 'configer-integration-'));
};

describe('Configer integration', () => {
  it('finds config through project search strategy', async () => {
    const temporaryDirectory: string = await createTemporaryDirectory();
    const configPath: string = path.join(temporaryDirectory, '.apprc.json');

    await writeFile(configPath, JSON.stringify({ value: VALUE_ONE }), 'utf8');

    const client: IConfigClient<Record<string, unknown>> = createConfiger({
      cwd: temporaryDirectory,
      moduleName: 'app',
    });

    const result: IConfigResult<Record<string, unknown>> | null = await client.findConfig();

    expect(result).not.toBeNull();
    expect(result?.config).toEqual({ value: VALUE_ONE });
    expect(result?.filepath).toContain('.apprc.json');
  });

  it('reads package.json property as config source', async () => {
    const temporaryDirectory: string = await createTemporaryDirectory();
    const packageJsonPath: string = path.join(temporaryDirectory, 'package.json');

    await writeFile(
      packageJsonPath,
      JSON.stringify({
        myapp: { isEnabled: true, retries: VALUE_TWO },
        name: 'test-package',
      }),
      'utf8',
    );

    const syncClient: IConfigClientSync<Record<string, unknown>> = createConfigerSync({
      cwd: temporaryDirectory,
      moduleName: 'myapp',
      searchPlaces: ['package.json'],
      shouldMergeSearchPlaces: false,
    });
    const result: IConfigResult<Record<string, unknown>> | null = syncClient.findConfig();

    expect(result).not.toBeNull();
    expect(result?.config).toEqual({ isEnabled: true, retries: VALUE_TWO });
  });

  it('merges inherited configs with environment overrides end-to-end', async () => {
    const temporaryDirectory: string = await createTemporaryDirectory();
    const baseConfigPath: string = path.join(temporaryDirectory, 'base.config.json');
    const appConfigPath: string = path.join(temporaryDirectory, '.apprc.json');

    await writeFile(
      baseConfigPath,
      JSON.stringify({
        apiUrl: 'https://api.default.example.com',
        isDebugEnabled: false,
        retries: VALUE_ONE,
      }),
      'utf8',
    );

    await writeFile(
      appConfigPath,
      JSON.stringify({
        $development: { isDebugEnabled: true },
        $env: { development: { apiUrl: 'https://api.dev.example.com' } },
        extends: './base.config.json',
        retries: VALUE_THREE,
      }),
      'utf8',
    );

    const client: IConfigClient<Record<string, unknown>> = createConfiger({
      cwd: temporaryDirectory,
      envName: 'development',
      moduleName: 'app',
    });
    const result: IConfigResult<Record<string, unknown>> | null = await client.findConfig();

    expect(result).not.toBeNull();
    expect(result?.config).toEqual({
      apiUrl: 'https://api.dev.example.com',
      isDebugEnabled: true,
      retries: VALUE_THREE,
    });
  });

  it('caches find and read results correctly', async () => {
    const temporaryDirectory: string = await createTemporaryDirectory();
    const configPath: string = path.join(temporaryDirectory, '.apprc.json');

    await writeFile(configPath, JSON.stringify({ value: VALUE_ONE }), 'utf8');

    const client: IConfigClient<Record<string, unknown>> = createConfiger({
      cwd: temporaryDirectory,
      moduleName: 'app',
      withCache: true,
    });
    const firstResult: IConfigResult<Record<string, unknown>> | null = await client.findConfig();
    const secondResult: IConfigResult<Record<string, unknown>> | null = await client.findConfig();

    expect(firstResult).toEqual(secondResult);

    client.clearCaches();

    const thirdResult: IConfigResult<Record<string, unknown>> | null = await client.findConfig();

    expect(thirdResult?.config).toEqual({ value: VALUE_ONE });
  });

  it('uses custom loaders for non-standard file extensions', async () => {
    const temporaryDirectory: string = await createTemporaryDirectory();
    const configPath: string = path.join(temporaryDirectory, 'settings.custom');

    await writeFile(configPath, 'KEY=VALUE', 'utf8');

    const client: IConfigClient<Record<string, unknown>> = createConfiger({
      cwd: temporaryDirectory,
      loaders: {
        '.custom': {
          asyncLoader: (_filepath: string, content: string): Record<string, string> => {
            const outputRecord: Record<string, string> = {};
            const delimiterIndex: number = content.indexOf('=');

            if (delimiterIndex > 0) {
              const key: string = content.slice(0, delimiterIndex);
              const value: string = content.slice(delimiterIndex + VALUE_ONE);
              outputRecord[key] = value;
            }

            return outputRecord;
          },
        },
      },
      moduleName: 'app',
      searchPlaces: ['settings.custom'],
      shouldMergeSearchPlaces: false,
    });
    const result: IConfigResult<Record<string, unknown>> | null = await client.findConfig();

    expect(result).not.toBeNull();
    expect(result?.config).toEqual({ KEY: 'VALUE' });
  });

  it('applies transform and exposes inheritance sources in end-to-end flow', async () => {
    const temporaryDirectory: string = await createTemporaryDirectory();
    const baseConfigPath: string = path.join(temporaryDirectory, 'base.config.json');
    const appConfigPath: string = path.join(temporaryDirectory, '.apprc.json');

    await writeFile(
      baseConfigPath,
      JSON.stringify({
        retries: VALUE_ONE,
        title: 'base',
      }),
      'utf8',
    );
    await writeFile(
      appConfigPath,
      JSON.stringify({
        $production: {
          retries: VALUE_THREE,
        },
        $staging: {
          retries: VALUE_TWO,
        },
        extends: './base.config.json',
      }),
      'utf8',
    );

    const client: IConfigClient<Record<string, unknown>> = createConfiger({
      cwd: temporaryDirectory,
      envName: 'production',
      moduleName: 'app',
      transform: (result: IConfigResult<Record<string, unknown>>) => {
        return {
          ...result,
          config: {
            ...result.config,
            isTransformed: true,
          },
        };
      },
    });
    const result: IConfigResult<Record<string, unknown>> | null = await client.findConfig();

    expect(result?.config).toEqual({
      isTransformed: true,
      retries: VALUE_THREE,
      title: 'base',
    });
    expect(result?.sources).toEqual([baseConfigPath, appConfigPath]);
  });
});
