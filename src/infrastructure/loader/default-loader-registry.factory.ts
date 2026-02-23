import type { ILoaderRegistryEntry } from '@domain/entity/loader-registry-entry.entity';
import type { TLoaderRegistry } from '@domain/type/loader-registry.type';
import type { EnvironmentLoaderAdapter } from '@infrastructure/loader/environment-loader.adapter';
import type { JsLoaderAdapter } from '@infrastructure/loader/js-loader.adapter';
import type { JsonLoaderAdapter } from '@infrastructure/loader/json-loader.adapter';
import type { Json5LoaderAdapter } from '@infrastructure/loader/json5-loader.adapter';
import type { JsoncLoaderAdapter } from '@infrastructure/loader/jsonc-loader.adapter';
import type { PackageJsonLoaderAdapter } from '@infrastructure/loader/package-json-loader.adapter';
import type { TomlLoaderAdapter } from '@infrastructure/loader/toml-loader.adapter';
import type { YamlLoaderAdapter } from '@infrastructure/loader/yaml-loader.adapter';

export class DefaultLoaderRegistryFactory {
  private readonly ENVIRONMENT_LOADER_ADAPTER: EnvironmentLoaderAdapter;

  private readonly JS_LOADER_ADAPTER: JsLoaderAdapter;

  private readonly JSON_LOADER_ADAPTER: JsonLoaderAdapter;

  private readonly JSON5_LOADER_ADAPTER: Json5LoaderAdapter;

  private readonly JSONC_LOADER_ADAPTER: JsoncLoaderAdapter;

  private readonly PACKAGE_JSON_LOADER_ADAPTER: PackageJsonLoaderAdapter;

  private readonly TOML_LOADER_ADAPTER: TomlLoaderAdapter;

  private readonly YAML_LOADER_ADAPTER: YamlLoaderAdapter;

  public constructor(
    environmentLoaderAdapter: EnvironmentLoaderAdapter,
    jsLoaderAdapter: JsLoaderAdapter,
    json5LoaderAdapter: Json5LoaderAdapter,
    jsoncLoaderAdapter: JsoncLoaderAdapter,
    jsonLoaderAdapter: JsonLoaderAdapter,
    packageJsonLoaderAdapter: PackageJsonLoaderAdapter,
    tomlLoaderAdapter: TomlLoaderAdapter,
    yamlLoaderAdapter: YamlLoaderAdapter,
  ) {
    this.ENVIRONMENT_LOADER_ADAPTER = environmentLoaderAdapter;
    this.JS_LOADER_ADAPTER = jsLoaderAdapter;
    this.JSON5_LOADER_ADAPTER = json5LoaderAdapter;
    this.JSONC_LOADER_ADAPTER = jsoncLoaderAdapter;
    this.JSON_LOADER_ADAPTER = jsonLoaderAdapter;
    this.PACKAGE_JSON_LOADER_ADAPTER = packageJsonLoaderAdapter;
    this.TOML_LOADER_ADAPTER = tomlLoaderAdapter;
    this.YAML_LOADER_ADAPTER = yamlLoaderAdapter;
  }

  public readonly create = (): TLoaderRegistry => {
    const registry: TLoaderRegistry = {
      '.cjs': {
        asyncLoader: this.JS_LOADER_ADAPTER.loadAsync,
        syncLoader: this.JS_LOADER_ADAPTER.loadSync,
      },
      '.cts': {
        asyncLoader: this.JS_LOADER_ADAPTER.loadAsync,
        syncLoader: this.JS_LOADER_ADAPTER.loadSync,
      },
      '.env': {
        asyncLoader: this.ENVIRONMENT_LOADER_ADAPTER.loadAsync,
        syncLoader: this.ENVIRONMENT_LOADER_ADAPTER.loadSync,
      },
      '.js': {
        asyncLoader: this.JS_LOADER_ADAPTER.loadAsync,
        syncLoader: this.JS_LOADER_ADAPTER.loadSync,
      },
      '.json': {
        asyncLoader: this.JSON_LOADER_ADAPTER.loadAsync,
        syncLoader: this.JSON_LOADER_ADAPTER.loadSync,
      },
      '.json5': {
        asyncLoader: this.JSON5_LOADER_ADAPTER.loadAsync,
        syncLoader: this.JSON5_LOADER_ADAPTER.loadSync,
      },
      '.jsonc': {
        asyncLoader: this.JSONC_LOADER_ADAPTER.loadAsync,
        syncLoader: this.JSONC_LOADER_ADAPTER.loadSync,
      },
      '.mjs': {
        asyncLoader: this.JS_LOADER_ADAPTER.loadAsync,
        syncLoader: this.JS_LOADER_ADAPTER.loadSync,
      },
      '.mts': {
        asyncLoader: this.JS_LOADER_ADAPTER.loadAsync,
        syncLoader: this.JS_LOADER_ADAPTER.loadSync,
      },
      '.toml': {
        asyncLoader: this.TOML_LOADER_ADAPTER.loadAsync,
        syncLoader: this.TOML_LOADER_ADAPTER.loadSync,
      },
      '.ts': {
        asyncLoader: this.JS_LOADER_ADAPTER.loadAsync,
        syncLoader: this.JS_LOADER_ADAPTER.loadSync,
      },
      '.yaml': {
        asyncLoader: this.YAML_LOADER_ADAPTER.loadAsync,
        syncLoader: this.YAML_LOADER_ADAPTER.loadSync,
      },
      '.yml': {
        asyncLoader: this.YAML_LOADER_ADAPTER.loadAsync,
        syncLoader: this.YAML_LOADER_ADAPTER.loadSync,
      },
      noExt: {
        asyncLoader: this.JSON_LOADER_ADAPTER.loadAsync,
        syncLoader: this.JSON_LOADER_ADAPTER.loadSync,
      },
      'package.json': {
        asyncLoader: this.PACKAGE_JSON_LOADER_ADAPTER.loadAsync,
        syncLoader: this.PACKAGE_JSON_LOADER_ADAPTER.loadSync,
      },
    };

    return registry;
  };

  public readonly merge = (
    baseRegistry: TLoaderRegistry,
    extraRegistry: Record<string, ILoaderRegistryEntry> = {},
  ): TLoaderRegistry => {
    return {
      ...baseRegistry,
      ...extraRegistry,
    };
  };
}
