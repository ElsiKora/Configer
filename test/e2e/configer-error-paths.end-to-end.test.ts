import type { IConfigClientSync } from '@domain/entity/config-client-sync.entity';
import type { IConfigClient } from '@domain/entity/config-client.entity';
import type { IConfigResult } from '@domain/entity/config-result.entity';
import type { IPluginContext } from '@domain/entity/plugin-context.entity';

import { mkdtemp, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';

import { ConfigError } from '@domain/error/config.error';
import { createConfiger, createConfigerSync } from '@src/index';
import { describe, expect, it } from 'vitest';

const DECIMAL_RADIX: number = '0123456789'.length;
const WAIT_SHORT_MS: number = Number.parseInt('10', DECIMAL_RADIX);

const createTemporaryDirectory = async (): Promise<string> => {
  return mkdtemp(path.join(os.tmpdir(), 'configer-error-paths-'));
};

const expectConfigErrorCodeAsync = async (
  callback: () => Promise<unknown>,
  expectedCode: string,
): Promise<void> => {
  let capturedError: unknown;

  try {
    await callback();
  } catch (error) {
    capturedError = error;
  }

  expect(capturedError).toBeInstanceOf(ConfigError);
  const configError: ConfigError = capturedError as ConfigError;

  expect(configError.CODE).toBe(expectedCode);
  expect(configError.message).toContain('Suggestions:');
};

const expectConfigErrorCodeSync = (callback: () => unknown, expectedCode: string): void => {
  let capturedError: unknown;

  try {
    callback();
  } catch (error) {
    capturedError = error;
  }

  expect(capturedError).toBeInstanceOf(ConfigError);
  const configError: ConfigError = capturedError as ConfigError;

  expect(configError.CODE).toBe(expectedCode);
  expect(configError.message).toContain('Suggestions:');
};

describe('Configer error paths', () => {
  it('throws loader-not-registered suggestions for unknown file extension', async () => {
    const temporaryDirectory: string = await createTemporaryDirectory();
    const unknownFilepath: string = path.join(temporaryDirectory, 'config.ini');

    const client: IConfigClient<Record<string, unknown>> = createConfiger({
      cwd: temporaryDirectory,
      moduleName: 'app',
    });

    await writeFile(unknownFilepath, 'A=B', 'utf8');

    await expectConfigErrorCodeAsync(async (): Promise<unknown> => {
      return client.readConfig(unknownFilepath);
    }, 'CONFIG_LOADER_NOT_REGISTERED');
  });

  it('throws sync-loader-missing for async-only custom loader in sync API', async () => {
    const temporaryDirectory: string = await createTemporaryDirectory();
    const customFilepath: string = path.join(temporaryDirectory, 'settings.custom');

    const clientSync: IConfigClientSync<Record<string, unknown>> = createConfigerSync({
      cwd: temporaryDirectory,
      loaders: {
        '.custom': {
          asyncLoader: async (): Promise<Record<string, unknown>> => {
            await delay(WAIT_SHORT_MS);

            return { value: 'ok' };
          },
        },
      },
      moduleName: 'app',
    });

    await writeFile(customFilepath, 'ignored', 'utf8');

    clientSync.clearCaches();
    clientSync.clearFindCache();
    clientSync.clearReadCache();

    expectConfigErrorCodeSync((): unknown => {
      return clientSync.readConfig(customFilepath);
    }, 'CONFIG_SYNC_LOADER_MISSING');
  });

  it('throws inheritance and environment validation errors with suggestions', async () => {
    const temporaryDirectory: string = await createTemporaryDirectory();
    const appConfigPath: string = path.join(temporaryDirectory, '.apprc.json');

    const client: IConfigClient<Record<string, unknown>> = createConfiger({
      cwd: temporaryDirectory,
      envName: 'development',
      moduleName: 'app',
    });

    await writeFile(appConfigPath, '{"extends":{"invalid":"value"}}', 'utf8');
    await expectConfigErrorCodeAsync(async (): Promise<unknown> => {
      return client.findConfig();
    }, 'CONFIG_INVALID_INHERITANCE_VALUE');

    await writeFile(appConfigPath, '{"extends":[1]}', 'utf8');
    await expectConfigErrorCodeAsync(async (): Promise<unknown> => {
      return client.findConfig();
    }, 'CONFIG_INVALID_INHERITANCE_ENTRY');

    await writeFile(appConfigPath, '{"$development":"invalid"}', 'utf8');
    await expectConfigErrorCodeAsync(async (): Promise<unknown> => {
      return client.findConfig();
    }, 'CONFIG_INVALID_ENVIRONMENT_OVERRIDE');

    await writeFile(appConfigPath, '{"$env":"invalid"}', 'utf8');
    await expectConfigErrorCodeAsync(async (): Promise<unknown> => {
      return client.findConfig();
    }, 'CONFIG_INVALID_ENVIRONMENT_MAP');

    await writeFile(appConfigPath, '{"$env":{"development":"invalid"}}', 'utf8');
    await expectConfigErrorCodeAsync(async (): Promise<unknown> => {
      return client.findConfig();
    }, 'CONFIG_INVALID_ENVIRONMENT_MAP_ENTRY');
  });

  it('throws cycle detection and sync function promise errors', async () => {
    const temporaryDirectory: string = await createTemporaryDirectory();
    const appConfigPath: string = path.join(temporaryDirectory, '.apprc.json');
    const secondConfigPath: string = path.join(temporaryDirectory, 'second.config.json');
    const functionConfigPath: string = path.join(temporaryDirectory, 'app.config.cjs');

    const asyncClient: IConfigClient<Record<string, unknown>> = createConfiger({
      cwd: temporaryDirectory,
      moduleName: 'app',
    });

    const syncClient: IConfigClientSync<Record<string, unknown>> = createConfigerSync({
      cwd: temporaryDirectory,
      moduleName: 'app',
      searchPlaces: ['app.config.cjs'],
      shouldMergeSearchPlaces: false,
    });

    await writeFile(appConfigPath, '{"extends":"./second.config.json"}', 'utf8');
    await writeFile(secondConfigPath, '{"extends":"./.apprc.json"}', 'utf8');

    await expectConfigErrorCodeAsync(async (): Promise<unknown> => {
      return asyncClient.findConfig();
    }, 'CONFIG_INHERITANCE_CYCLE');

    await writeFile(
      functionConfigPath,
      'module.exports = () => Promise.resolve({ isEnabled: true });',
      'utf8',
    );
    expectConfigErrorCodeSync((): unknown => {
      return syncClient.findConfig();
    }, 'CONFIG_SYNC_FUNCTION_RETURNED_PROMISE');
  });

  it('runs onError plugin hook when find/read operations fail', async () => {
    const temporaryDirectory: string = await createTemporaryDirectory();
    const appConfigPath: string = path.join(temporaryDirectory, '.apprc.json');
    let hasOnErrorBeenCalled: boolean = false;

    const client: IConfigClient<Record<string, unknown>> = createConfiger({
      cwd: temporaryDirectory,
      moduleName: 'app',
      plugins: [
        {
          name: 'on-error-plugin',
          onError: async (_error: Error, _context: IPluginContext): Promise<void> => {
            await delay(WAIT_SHORT_MS);
            hasOnErrorBeenCalled = true;
          },
        },
      ],
    });

    await writeFile(appConfigPath, '{"extends":[1]}', 'utf8');

    await expectConfigErrorCodeAsync(async (): Promise<unknown> => {
      return client.findConfig();
    }, 'CONFIG_INVALID_INHERITANCE_ENTRY');
    expect(hasOnErrorBeenCalled).toBe(true);
  });

  it('throws sync transform promise errors with suggestions', async () => {
    const temporaryDirectory: string = await createTemporaryDirectory();
    const appConfigPath: string = path.join(temporaryDirectory, '.apprc.json');

    await writeFile(appConfigPath, '{"isEnabled":true}', 'utf8');

    const syncClient: IConfigClientSync<Record<string, unknown>> = createConfigerSync({
      cwd: temporaryDirectory,
      moduleName: 'app',
      transform: async (
        result: IConfigResult<Record<string, unknown>>,
      ): Promise<IConfigResult<Record<string, unknown>>> => {
        await delay(WAIT_SHORT_MS);

        return result;
      },
    });

    expectConfigErrorCodeSync((): unknown => {
      return syncClient.findConfig();
    }, 'CONFIG_SYNC_TRANSFORM_RETURNED_PROMISE');
  });
});
