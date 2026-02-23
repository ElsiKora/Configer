import type { IConfigClientSync } from '@domain/entity/config-client-sync.entity';
import type { IConfigClient } from '@domain/entity/config-client.entity';
import type { IConfigResult } from '@domain/entity/config-result.entity';
import type { IPluginContext } from '@domain/entity/plugin-context.entity';
import type { IConfigPlugin } from '@domain/entity/plugin.entity';
import type { IWatchHandle } from '@domain/entity/watch-handle.entity';

import { mkdtemp, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';

import { ConfigError } from '@domain/error/config.error';
import { createConfiger, createConfigerSync } from '@src/index';
import { describe, expect, it } from 'vitest';

const DECIMAL_RADIX: number = '0123456789'.length;
const VALUE_ONE: number = Number.parseInt('1', DECIMAL_RADIX);
const VALUE_TWO: number = Number.parseInt('2', DECIMAL_RADIX);
const VALUE_THREE: number = Number.parseInt('3', DECIMAL_RADIX);
const VALUE_FOUR: number = Number.parseInt('4', DECIMAL_RADIX);
const VALUE_FIVE: number = Number.parseInt('5', DECIMAL_RADIX);
const VALUE_SIX: number = Number.parseInt('6', DECIMAL_RADIX);
const DATABASE_PORT: number = Number.parseInt('5432', DECIMAL_RADIX);
const WAIT_SHORT_MS: number = Number.parseInt('40', DECIMAL_RADIX);
const WAIT_LONG_MS: number = Number.parseInt('500', DECIMAL_RADIX);

const createTemporaryDirectory = async (): Promise<string> => {
  return mkdtemp(path.join(os.tmpdir(), 'configer-test-'));
};

describe('Configer client', () => {
  it('reads supported file formats in async and sync modes', async () => {
    const temporaryDirectory: string = await createTemporaryDirectory();
    const yamlPath: string = path.join(temporaryDirectory, 'settings.yaml');
    const tomlPath: string = path.join(temporaryDirectory, 'settings.toml');
    const json5Path: string = path.join(temporaryDirectory, 'settings.json5');
    const jsoncPath: string = path.join(temporaryDirectory, 'settings.jsonc');
    const environmentPath: string = path.join(temporaryDirectory, '.env');

    await writeFile(yamlPath, 'isEnabled: true\nretries: 1\n', 'utf8');
    await writeFile(tomlPath, 'isEnabled = true\nretries = 2\n', 'utf8');
    await writeFile(json5Path, '{ isEnabled: true, retries: [1, 2,], }', 'utf8');
    await writeFile(jsoncPath, '{\n  "isEnabled": true,\n  "depth": 3,\n}\n', 'utf8');
    await writeFile(environmentPath, 'FOO=bar\nexport BAR="baz"\n', 'utf8');

    const asyncClient: IConfigClient<Record<string, unknown>> = createConfiger<
      Record<string, unknown>
    >({
      cwd: temporaryDirectory,
      moduleName: 'app',
    });

    const syncClient: IConfigClientSync<Record<string, unknown>> = createConfigerSync<
      Record<string, unknown>
    >({
      cwd: temporaryDirectory,
      moduleName: 'app',
    });

    const environmentSyncClient: IConfigClientSync<Record<string, string>> = createConfigerSync<
      Record<string, string>
    >({
      cwd: temporaryDirectory,
      moduleName: 'app',
    });

    const yamlResult: IConfigResult<Record<string, unknown>> =
      await asyncClient.readConfig(yamlPath);

    const tomlResult: IConfigResult<Record<string, unknown>> =
      await asyncClient.readConfig(tomlPath);

    const json5Result: IConfigResult<Record<string, unknown>> =
      await asyncClient.readConfig(json5Path);
    const jsoncResult: IConfigResult<Record<string, unknown>> = syncClient.readConfig(jsoncPath);

    const environmentResult: IConfigResult<Record<string, string>> =
      environmentSyncClient.readConfig(environmentPath);

    expect(yamlResult.config).toEqual({
      isEnabled: true,
      retries: VALUE_ONE,
    });
    expect(tomlResult.config).toEqual({
      isEnabled: true,
      retries: VALUE_TWO,
    });
    expect(json5Result.config).toEqual({
      isEnabled: true,
      retries: [VALUE_ONE, VALUE_TWO],
    });
    expect(jsoncResult.config).toEqual({
      depth: VALUE_THREE,
      isEnabled: true,
    });
    expect(environmentResult.config).toEqual({
      BAR: 'baz',
      FOO: 'bar',
    });
  });

  it('parses advanced YAML TOML JSON5 and JSONC syntax', async () => {
    const temporaryDirectory: string = await createTemporaryDirectory();
    const yamlPath: string = path.join(temporaryDirectory, 'advanced.yaml');
    const tomlPath: string = path.join(temporaryDirectory, 'advanced.toml');
    const json5Path: string = path.join(temporaryDirectory, 'advanced.json5');
    const jsoncPath: string = path.join(temporaryDirectory, 'advanced.jsonc');

    await writeFile(yamlPath, 'meta: { host: localhost, port: 5432 }\nitems: [1, 2, 3]\n', 'utf8');
    await writeFile(
      tomlPath,
      'title = "demo"\n[[items]]\nname = "first"\n[[items]]\nname = "second"\n',
      'utf8',
    );
    await writeFile(
      json5Path,
      "{ max: Infinity, value: NaN, nested: { text: 'ok' }, list: [1, 2,], }",
      'utf8',
    );
    await writeFile(jsoncPath, '{\n  // comment\n  "isEnabled": true,\n  "depth": 3,\n}\n', 'utf8');

    const client: IConfigClient<Record<string, unknown>> = createConfiger<Record<string, unknown>>({
      cwd: temporaryDirectory,
      moduleName: 'app',
    });

    const yamlResult: IConfigResult<Record<string, unknown>> = await client.readConfig(yamlPath);
    const tomlResult: IConfigResult<Record<string, unknown>> = await client.readConfig(tomlPath);
    const json5Result: IConfigResult<Record<string, unknown>> = await client.readConfig(json5Path);
    const jsoncResult: IConfigResult<Record<string, unknown>> = await client.readConfig(jsoncPath);
    const json5Config: Record<string, unknown> = json5Result.config ?? {};

    expect(yamlResult.config).toEqual({
      items: [VALUE_ONE, VALUE_TWO, VALUE_THREE],
      meta: {
        host: 'localhost',
        port: DATABASE_PORT,
      },
    });
    expect(tomlResult.config).toEqual({
      items: [{ name: 'first' }, { name: 'second' }],
      title: 'demo',
    });
    expect(json5Config).toMatchObject({
      list: [VALUE_ONE, VALUE_TWO],
      max: Infinity,
      nested: {
        text: 'ok',
      },
    });
    expect(json5Config.value).toBeNaN();
    expect(jsoncResult.config).toEqual({
      depth: VALUE_THREE,
      isEnabled: true,
    });
  });

  it('resolves inheritance and environment overrides', async () => {
    const temporaryDirectory: string = await createTemporaryDirectory();
    const baseConfigPath: string = path.join(temporaryDirectory, 'base.config.json');
    const appConfigPath: string = path.join(temporaryDirectory, '.apprc.json');

    await writeFile(
      baseConfigPath,
      JSON.stringify({
        isFeatureEnabled: false,
        list: [VALUE_ONE],
        nested: {
          first: VALUE_ONE,
        },
        title: 'base',
      }),
      'utf8',
    );
    await writeFile(
      appConfigPath,
      JSON.stringify({
        $development: {
          isFeatureEnabled: true,
        },
        $env: {
          development: {
            isFromMap: true,
          },
        },
        extends: './base.config.json',
        list: [VALUE_TWO],
        nested: {
          second: VALUE_TWO,
        },
      }),
      'utf8',
    );

    const client: IConfigClient<Record<string, unknown>> = createConfiger({
      cwd: temporaryDirectory,
      envName: 'development',
      moduleName: 'app',
    });
    const result: IConfigResult<Record<string, unknown>> | null = await client.findConfig();

    expect(result?.config).toEqual({
      isFeatureEnabled: true,
      isFromMap: true,
      list: [VALUE_TWO],
      nested: {
        first: VALUE_ONE,
        second: VALUE_TWO,
      },
      title: 'base',
    });
  });

  it('applies transform, tracks inheritance sources and strips inactive env directives', async () => {
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
          retries: VALUE_FIVE,
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

  it('executes config functions and plugin lifecycle hooks', async () => {
    const temporaryDirectory: string = await createTemporaryDirectory();
    const configPath: string = path.join(temporaryDirectory, 'app.config.mjs');

    await writeFile(
      configPath,
      `export default (context) => ({ contextValue: context.userContext.value, moduleName: context.moduleName })`,
      'utf8',
    );

    const plugin: IConfigPlugin<Record<string, unknown>> = {
      afterFind: (result: IConfigResult<Record<string, unknown>> | null) => {
        if (!result?.config) {
          return result;
        }

        return {
          ...result,
          config: {
            ...result.config,
            stage: 'after-find',
          },
        };
      },
      afterRead: (result: IConfigResult<Record<string, unknown>>) => {
        return {
          ...result,
          config: {
            ...result.config,
            stage: 'after-read',
          },
        };
      },
      name: 'test-plugin',
    };

    const client: IConfigClient<Record<string, unknown>> = createConfiger<Record<string, unknown>>({
      context: {
        value: 'context',
      },
      cwd: temporaryDirectory,
      moduleName: 'app',
      plugins: [plugin],
      searchPlaces: ['app.config.mjs'],
      shouldMergeSearchPlaces: false,
    });
    const result: IConfigResult<Record<string, unknown>> | null = await client.findConfig();

    expect(result?.config).toEqual({
      contextValue: 'context',
      moduleName: 'app',
      stage: 'after-find',
    });
  });

  it('throws schema and sync-plugin errors with suggestions', async () => {
    const temporaryDirectory: string = await createTemporaryDirectory();
    const appConfigPath: string = path.join(temporaryDirectory, '.apprc.json');

    await writeFile(appConfigPath, JSON.stringify({ count: 'wrong' }), 'utf8');

    const schemaClient: IConfigClient<Record<string, unknown>> = createConfiger({
      cwd: temporaryDirectory,
      moduleName: 'app',
      schema: {
        properties: {
          count: {
            isRequired: true,
            type: 'number',
          },
        },
        shouldAllowUnknownProperties: false,
        type: 'object',
      },
    });

    await expect(schemaClient.findConfig()).rejects.toThrowError(ConfigError);
    await expect(schemaClient.findConfig()).rejects.toThrow(/Suggestions:/);

    const syncClient: IConfigClientSync<Record<string, unknown>> = createConfigerSync({
      cwd: temporaryDirectory,
      moduleName: 'app',
      plugins: [
        {
          beforeRead: async (context: IPluginContext): Promise<IPluginContext> => {
            await delay(WAIT_SHORT_MS);

            return context;
          },
          name: 'async-plugin',
        },
      ],
    });

    expect(() => syncClient.readConfig(appConfigPath)).toThrowError(ConfigError);
    expect(() => syncClient.readConfig(appConfigPath)).toThrowError(/Suggestions:/);

    const syncTransformClient: IConfigClientSync<Record<string, unknown>> = createConfigerSync({
      cwd: temporaryDirectory,
      moduleName: 'app',
      transform: async (
        result: IConfigResult<Record<string, unknown>>,
      ): Promise<IConfigResult<Record<string, unknown>>> => {
        await delay(WAIT_SHORT_MS);

        return result;
      },
    });

    let transformError: unknown;

    try {
      syncTransformClient.readConfig(appConfigPath);
    } catch (error) {
      transformError = error;
    }

    expect(transformError).toBeInstanceOf(ConfigError);
    expect((transformError as ConfigError).CODE).toBe('CONFIG_SYNC_TRANSFORM_RETURNED_PROMISE');
  });

  it('watches config updates with debounce', async () => {
    const temporaryDirectory: string = await createTemporaryDirectory();
    const appConfigPath: string = path.join(temporaryDirectory, '.apprc.json');

    await writeFile(appConfigPath, JSON.stringify({ value: VALUE_ONE }), 'utf8');

    const client: IConfigClient<{ value: number }> = createConfiger<{ value: number }>({
      cwd: temporaryDirectory,
      moduleName: 'app',
    });
    const receivedResults: Array<IConfigResult<{ value: number }> | null> = [];

    const watchHandle: IWatchHandle = client.watchConfig(
      (error: Error | null, result: IConfigResult<{ value: number }> | null): void => {
        if (error) {
          return;
        }

        receivedResults.push(result);
      },
    );

    await writeFile(appConfigPath, JSON.stringify({ value: VALUE_TWO }), 'utf8');
    await delay(WAIT_SHORT_MS);
    await writeFile(appConfigPath, JSON.stringify({ value: VALUE_THREE }), 'utf8');
    await delay(WAIT_LONG_MS);
    watchHandle.close();

    expect(receivedResults.length).toBeGreaterThanOrEqual(VALUE_ONE);
    expect(receivedResults.at(-VALUE_ONE)?.config).toEqual({ value: VALUE_THREE });
  });
});
