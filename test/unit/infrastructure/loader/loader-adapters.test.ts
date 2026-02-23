import type { ILoaderContext } from '@domain/entity/loader.entity';

import { mkdtemp, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { ConfigError } from '@domain/error/config.error';
import { EnvironmentParserAdapter } from '@infrastructure/adapter/environment-parser.adapter';
import { Json5ParserAdapter } from '@infrastructure/adapter/json5-parser.adapter';
import { JsoncParserAdapter } from '@infrastructure/adapter/jsonc-parser.adapter';
import { TomlParserAdapter } from '@infrastructure/adapter/toml-parser.adapter';
import { YamlParserAdapter } from '@infrastructure/adapter/yaml-parser.adapter';
import { EnvironmentLoaderAdapter } from '@infrastructure/loader/environment-loader.adapter';
import { JsLoaderAdapter } from '@infrastructure/loader/js-loader.adapter';
import { JsonLoaderAdapter } from '@infrastructure/loader/json-loader.adapter';
import { Json5LoaderAdapter } from '@infrastructure/loader/json5-loader.adapter';
import { JsoncLoaderAdapter } from '@infrastructure/loader/jsonc-loader.adapter';
import { PackageJsonLoaderAdapter } from '@infrastructure/loader/package-json-loader.adapter';
import { LoaderKeyResolverAdapter } from '@infrastructure/loader/resolve-loader-key.adapter';
import { TomlLoaderAdapter } from '@infrastructure/loader/toml-loader.adapter';
import { YamlLoaderAdapter } from '@infrastructure/loader/yaml-loader.adapter';
import { describe, expect, it } from 'vitest';

const DECIMAL_RADIX: number = '0123456789'.length;
const VALUE_ONE: number = Number.parseInt('1', DECIMAL_RADIX);
const VALUE_TWO: number = Number.parseInt('2', DECIMAL_RADIX);

const createTemporaryDirectory = async (): Promise<string> => {
  return mkdtemp(path.join(os.tmpdir(), 'configer-loader-adapters-'));
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
};

describe('Loader adapters', () => {
  it('loads CommonJS and ESM config values', async () => {
    const temporaryDirectory: string = await createTemporaryDirectory();
    const cjsFilepath: string = path.join(temporaryDirectory, 'config.cjs');
    const mjsFilepath: string = path.join(temporaryDirectory, 'config.mjs');

    await writeFile(cjsFilepath, 'module.exports = { isEnabled: true };', 'utf8');
    await writeFile(mjsFilepath, 'export default { retries: 2 };', 'utf8');

    const jsLoaderAdapter: JsLoaderAdapter = new JsLoaderAdapter();

    const cjsLoadedValue: unknown = jsLoaderAdapter.loadSync(cjsFilepath, '', {
      moduleName: 'app',
      packagePropertyPath: ['app'],
    });

    const mjsLoadedValue: unknown = await jsLoaderAdapter.loadAsync(mjsFilepath, '', {
      moduleName: 'app',
      packagePropertyPath: ['app'],
    });

    expect(cjsLoadedValue).toEqual({
      isEnabled: true,
    });
    expect(mjsLoadedValue).toEqual({
      retries: VALUE_TWO,
    });
  });

  it('throws sync extension error for mjs/ts in sync mode', () => {
    const jsLoaderAdapter: JsLoaderAdapter = new JsLoaderAdapter();

    const temporaryDirectory: string = path.join(
      os.tmpdir(),
      'configer-loader-adapters-safe',
      'sync-error',
    );
    const mjsFilepath: string = path.join(temporaryDirectory, 'config.mjs');

    const loadSyncCallback = (): unknown => {
      return jsLoaderAdapter.loadSync(mjsFilepath, '', {
        moduleName: 'app',
        packagePropertyPath: ['app'],
      });
    };

    expectConfigErrorCodeSync(loadSyncCallback, 'CONFIG_SYNC_UNSUPPORTED_EXTENSION');
  });

  it('parses JSON loader and handles empty payload', async () => {
    const temporaryDirectory: string = await createTemporaryDirectory();
    const jsonFilepath: string = path.join(temporaryDirectory, 'config.json');
    const jsonLoaderAdapter: JsonLoaderAdapter = new JsonLoaderAdapter();

    const emptyValue: unknown = jsonLoaderAdapter.loadSync(jsonFilepath, '   ', {
      moduleName: 'app',
      packagePropertyPath: ['app'],
    });

    const parsedValue: unknown = jsonLoaderAdapter.loadSync(jsonFilepath, '{"value":1}', {
      moduleName: 'app',
      packagePropertyPath: ['app'],
    });

    expect(emptyValue).toBeUndefined();

    expect(parsedValue).toEqual({
      value: VALUE_ONE,
    });
  });

  it('extracts package property path value', async () => {
    const temporaryDirectory: string = await createTemporaryDirectory();
    const packageJsonFilepath: string = path.join(temporaryDirectory, 'package.json');
    const packageLoaderAdapter: PackageJsonLoaderAdapter = new PackageJsonLoaderAdapter();

    const loaderContext: ILoaderContext = {
      moduleName: 'app',
      packagePropertyPath: ['app', 'nested', 'value'],
    };

    const parsedValue: unknown = packageLoaderAdapter.loadSync(
      packageJsonFilepath,
      '{"app":{"nested":{"value":1}}}',
      loaderContext,
    );

    const missingValue: unknown = packageLoaderAdapter.loadSync(
      packageJsonFilepath,
      '{"app":{"nested":{"value":1}}}',
      {
        moduleName: 'app',
        packagePropertyPath: ['app', 'nested', 'missing'],
      },
    );

    const nonObjectPathValue: unknown = packageLoaderAdapter.loadSync(
      packageJsonFilepath,
      '{"app":{"nested":1}}',
      loaderContext,
    );

    const emptyPackageValue: unknown = packageLoaderAdapter.loadSync(
      packageJsonFilepath,
      '   ',
      loaderContext,
    );

    expect(parsedValue).toBe(VALUE_ONE);
    expect(missingValue).toBeUndefined();
    expect(nonObjectPathValue).toBeUndefined();
    expect(emptyPackageValue).toBeUndefined();
  });

  it('throws package parse error for invalid package json payload', async () => {
    const temporaryDirectory: string = await createTemporaryDirectory();
    const packageJsonFilepath: string = path.join(temporaryDirectory, 'package.json');
    const packageLoaderAdapter: PackageJsonLoaderAdapter = new PackageJsonLoaderAdapter();

    expectConfigErrorCodeSync((): unknown => {
      return packageLoaderAdapter.loadSync(packageJsonFilepath, '{"app":', {
        moduleName: 'app',
        packagePropertyPath: ['app'],
      });
    }, 'CONFIG_PACKAGE_PARSE_ERROR');
  });

  it('resolves loader keys for package/env/no-extension files', () => {
    const loaderKeyResolverAdapter: LoaderKeyResolverAdapter = new LoaderKeyResolverAdapter();
    const packageKey: string = loaderKeyResolverAdapter.execute('/safe/project/package.json');
    const environmentKey: string = loaderKeyResolverAdapter.execute('/safe/project/.env.local');

    const environmentExtensionKey: string = loaderKeyResolverAdapter.execute(
      '/safe/project/config.env',
    );
    const noExtensionKey: string = loaderKeyResolverAdapter.execute('/safe/project/config');
    const jsonKey: string = loaderKeyResolverAdapter.execute('/safe/project/config.json');

    expect(packageKey).toBe('package.json');
    expect(environmentKey).toBe('.env');
    expect(environmentExtensionKey).toBe('.env');
    expect(noExtensionKey).toBe('noExt');
    expect(jsonKey).toBe('.json');
  });

  it('loads environment payloads and ignores empty content', () => {
    const environmentLoaderAdapter: EnvironmentLoaderAdapter = new EnvironmentLoaderAdapter(
      new EnvironmentParserAdapter(),
    );

    const loaderContext: ILoaderContext = {
      moduleName: 'app',
      packagePropertyPath: ['app'],
    };

    const emptyValue: unknown = environmentLoaderAdapter.loadSync(
      '/safe/project/.env',
      '   ',
      loaderContext,
    );

    const parsedValue: unknown = environmentLoaderAdapter.loadSync(
      '/safe/project/.env',
      'FOO=bar',
      loaderContext,
    );

    expect(emptyValue).toBeUndefined();
    expect(parsedValue).toEqual({
      FOO: 'bar',
    });
  });

  it('wraps parser errors for JSON5 JSONC TOML and YAML loaders', () => {
    const loaderContext: ILoaderContext = {
      moduleName: 'app',
      packagePropertyPath: ['app'],
    };

    const json5LoaderAdapter: Json5LoaderAdapter = new Json5LoaderAdapter(new Json5ParserAdapter());
    const jsoncLoaderAdapter: JsoncLoaderAdapter = new JsoncLoaderAdapter(new JsoncParserAdapter());
    const tomlLoaderAdapter: TomlLoaderAdapter = new TomlLoaderAdapter(new TomlParserAdapter());
    const yamlLoaderAdapter: YamlLoaderAdapter = new YamlLoaderAdapter(new YamlParserAdapter());

    expectConfigErrorCodeSync((): unknown => {
      return json5LoaderAdapter.loadSync('/safe/project/app.json5', '{ invalid: }', loaderContext);
    }, 'CONFIG_JSON5_PARSE_ERROR');
    expectConfigErrorCodeSync((): unknown => {
      return jsoncLoaderAdapter.loadSync('/safe/project/app.jsonc', '{ "value": }', loaderContext);
    }, 'CONFIG_JSONC_PARSE_ERROR');
    expectConfigErrorCodeSync((): unknown => {
      return tomlLoaderAdapter.loadSync('/safe/project/app.toml', 'invalidLine', loaderContext);
    }, 'CONFIG_TOML_PARSE_ERROR');
    expectConfigErrorCodeSync((): unknown => {
      return yamlLoaderAdapter.loadSync(
        '/safe/project/app.yaml',
        'root:\n  child: 1\n    bad: 2',
        loaderContext,
      );
    }, 'CONFIG_YAML_PARSE_ERROR');
  });

  it('loads JSON5 JSONC TOML and YAML payloads in async mode', async () => {
    const loaderContext: ILoaderContext = {
      moduleName: 'app',
      packagePropertyPath: ['app'],
    };

    const json5LoaderAdapter: Json5LoaderAdapter = new Json5LoaderAdapter(new Json5ParserAdapter());
    const jsoncLoaderAdapter: JsoncLoaderAdapter = new JsoncLoaderAdapter(new JsoncParserAdapter());
    const tomlLoaderAdapter: TomlLoaderAdapter = new TomlLoaderAdapter(new TomlParserAdapter());
    const yamlLoaderAdapter: YamlLoaderAdapter = new YamlLoaderAdapter(new YamlParserAdapter());

    const json5Value: unknown = await json5LoaderAdapter.loadAsync(
      '/safe/project/app.json5',
      '{ value: 1 }',
      loaderContext,
    );

    const json5EmptyValue: unknown = json5LoaderAdapter.loadSync(
      '/safe/project/app.json5',
      '   ',
      loaderContext,
    );

    const jsoncValue: unknown = await jsoncLoaderAdapter.loadAsync(
      '/safe/project/app.jsonc',
      '{ "value": 1 }',
      loaderContext,
    );

    const jsoncEmptyValue: unknown = jsoncLoaderAdapter.loadSync(
      '/safe/project/app.jsonc',
      '   ',
      loaderContext,
    );

    const tomlValue: unknown = await tomlLoaderAdapter.loadAsync(
      '/safe/project/app.toml',
      'value = 1',
      loaderContext,
    );

    const tomlEmptyValue: unknown = tomlLoaderAdapter.loadSync(
      '/safe/project/app.toml',
      '   ',
      loaderContext,
    );

    const yamlValue: unknown = await yamlLoaderAdapter.loadAsync(
      '/safe/project/app.yaml',
      'value: 1',
      loaderContext,
    );

    const yamlEmptyValue: unknown = yamlLoaderAdapter.loadSync(
      '/safe/project/app.yaml',
      '   ',
      loaderContext,
    );

    expect(json5Value).toEqual({
      value: VALUE_ONE,
    });
    expect(json5EmptyValue).toBeUndefined();
    expect(jsoncValue).toEqual({
      value: VALUE_ONE,
    });
    expect(jsoncEmptyValue).toBeUndefined();
    expect(tomlValue).toEqual({
      value: VALUE_ONE,
    });
    expect(tomlEmptyValue).toBeUndefined();
    expect(yamlValue).toEqual({
      value: VALUE_ONE,
    });
    expect(yamlEmptyValue).toBeUndefined();
  });
});
