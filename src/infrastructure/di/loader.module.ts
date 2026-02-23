import type { IConfigOptions } from '@domain/entity/config-options.entity';
import type { TLoaderRegistry } from '@domain/type/loader-registry.type';
import type { IDIModule } from '@elsikora/cladi';

import { createModule } from '@elsikora/cladi';
import { EnvironmentParserAdapter } from '@infrastructure/adapter/environment-parser.adapter';
import { Json5ParserAdapter } from '@infrastructure/adapter/json5-parser.adapter';
import { JsoncParserAdapter } from '@infrastructure/adapter/jsonc-parser.adapter';
import { TomlParserAdapter } from '@infrastructure/adapter/toml-parser.adapter';
import { YamlParserAdapter } from '@infrastructure/adapter/yaml-parser.adapter';
import { CONFIGER_DI_TOKEN } from '@infrastructure/di/token.constant';
import { DefaultLoaderRegistryFactory } from '@infrastructure/loader/default-loader-registry.factory';
import { EnvironmentLoaderAdapter } from '@infrastructure/loader/environment-loader.adapter';
import { JsLoaderAdapter } from '@infrastructure/loader/js-loader.adapter';
import { JsonLoaderAdapter } from '@infrastructure/loader/json-loader.adapter';
import { Json5LoaderAdapter } from '@infrastructure/loader/json5-loader.adapter';
import { JsoncLoaderAdapter } from '@infrastructure/loader/jsonc-loader.adapter';
import { PackageJsonLoaderAdapter } from '@infrastructure/loader/package-json-loader.adapter';
import { LoaderKeyResolverAdapter } from '@infrastructure/loader/resolve-loader-key.adapter';
import { TomlLoaderAdapter } from '@infrastructure/loader/toml-loader.adapter';
import { YamlLoaderAdapter } from '@infrastructure/loader/yaml-loader.adapter';

export const CONFIGER_LOADER_DI_MODULE: IDIModule = createModule({
  exports: [CONFIGER_DI_TOKEN.LOADER_KEY_RESOLVER_ADAPTER, CONFIGER_DI_TOKEN.LOADER_REGISTRY],
  name: 'configer-loader',
  providers: [
    {
      provide: CONFIGER_DI_TOKEN.ENVIRONMENT_LOADER_ADAPTER,
      useFactory: (): EnvironmentLoaderAdapter => {
        return new EnvironmentLoaderAdapter(new EnvironmentParserAdapter());
      },
    },
    {
      provide: CONFIGER_DI_TOKEN.JS_LOADER_ADAPTER,
      useFactory: (): JsLoaderAdapter => {
        return new JsLoaderAdapter();
      },
    },
    {
      provide: CONFIGER_DI_TOKEN.JSON5_LOADER_ADAPTER,
      useFactory: (): Json5LoaderAdapter => {
        return new Json5LoaderAdapter(new Json5ParserAdapter());
      },
    },
    {
      provide: CONFIGER_DI_TOKEN.JSONC_LOADER_ADAPTER,
      useFactory: (): JsoncLoaderAdapter => {
        return new JsoncLoaderAdapter(new JsoncParserAdapter());
      },
    },
    {
      provide: CONFIGER_DI_TOKEN.JSON_LOADER_ADAPTER,
      useFactory: (): JsonLoaderAdapter => {
        return new JsonLoaderAdapter();
      },
    },
    {
      provide: CONFIGER_DI_TOKEN.PACKAGE_JSON_LOADER_ADAPTER,
      useFactory: (): PackageJsonLoaderAdapter => {
        return new PackageJsonLoaderAdapter();
      },
    },
    {
      provide: CONFIGER_DI_TOKEN.TOML_LOADER_ADAPTER,
      useFactory: (): TomlLoaderAdapter => {
        return new TomlLoaderAdapter(new TomlParserAdapter());
      },
    },
    {
      provide: CONFIGER_DI_TOKEN.YAML_LOADER_ADAPTER,
      useFactory: (): YamlLoaderAdapter => {
        return new YamlLoaderAdapter(new YamlParserAdapter());
      },
    },
    {
      deps: [
        CONFIGER_DI_TOKEN.ENVIRONMENT_LOADER_ADAPTER,
        CONFIGER_DI_TOKEN.JS_LOADER_ADAPTER,
        CONFIGER_DI_TOKEN.JSON5_LOADER_ADAPTER,
        CONFIGER_DI_TOKEN.JSONC_LOADER_ADAPTER,
        CONFIGER_DI_TOKEN.JSON_LOADER_ADAPTER,
        CONFIGER_DI_TOKEN.PACKAGE_JSON_LOADER_ADAPTER,
        CONFIGER_DI_TOKEN.TOML_LOADER_ADAPTER,
        CONFIGER_DI_TOKEN.YAML_LOADER_ADAPTER,
      ],
      provide: CONFIGER_DI_TOKEN.DEFAULT_LOADER_REGISTRY_FACTORY,
      useFactory: (
        environmentLoaderAdapter: EnvironmentLoaderAdapter,
        jsLoaderAdapter: JsLoaderAdapter,
        json5LoaderAdapter: Json5LoaderAdapter,
        jsoncLoaderAdapter: JsoncLoaderAdapter,
        jsonLoaderAdapter: JsonLoaderAdapter,
        packageJsonLoaderAdapter: PackageJsonLoaderAdapter,
        tomlLoaderAdapter: TomlLoaderAdapter,
        yamlLoaderAdapter: YamlLoaderAdapter,
      ): DefaultLoaderRegistryFactory => {
        return new DefaultLoaderRegistryFactory(
          environmentLoaderAdapter,
          jsLoaderAdapter,
          json5LoaderAdapter,
          jsoncLoaderAdapter,
          jsonLoaderAdapter,
          packageJsonLoaderAdapter,
          tomlLoaderAdapter,
          yamlLoaderAdapter,
        );
      },
    },
    {
      deps: [CONFIGER_DI_TOKEN.DEFAULT_LOADER_REGISTRY_FACTORY, CONFIGER_DI_TOKEN.CONFIG_OPTIONS],
      provide: CONFIGER_DI_TOKEN.LOADER_REGISTRY,
      useFactory: (
        defaultLoaderRegistryFactory: DefaultLoaderRegistryFactory,
        options: IConfigOptions,
      ): TLoaderRegistry => {
        const defaultLoaderRegistry: TLoaderRegistry = defaultLoaderRegistryFactory.create();

        return defaultLoaderRegistryFactory.merge(defaultLoaderRegistry, options.loaders);
      },
    },
    {
      provide: CONFIGER_DI_TOKEN.LOADER_KEY_RESOLVER_ADAPTER,
      useFactory: (): LoaderKeyResolverAdapter => {
        return new LoaderKeyResolverAdapter();
      },
    },
  ],
});
