import type { ResolveSearchPlanUseCase } from '@application/use-case/resolve-search-plan.use-case';
import type { IConfigOptions } from '@domain/entity/config-options.entity';
import type { TLoaderRegistry } from '@domain/type/loader-registry.type';
import type { Token } from '@elsikora/cladi';
import type { ConfigClientSyncAdapter } from '@infrastructure/adapter/config-client-sync.adapter';
import type { ConfigClientAdapter } from '@infrastructure/adapter/config-client.adapter';
import type { DeepMergeAdapter } from '@infrastructure/adapter/deep-merge.adapter';
import type { SchemaValidatorAdapter } from '@infrastructure/adapter/schema-validator.adapter';
import type { MemoryConfigCacheAdapter } from '@infrastructure/cache/memory-config-cache.adapter';
import type { DefaultLoaderRegistryFactory } from '@infrastructure/loader/default-loader-registry.factory';
import type { EnvironmentLoaderAdapter } from '@infrastructure/loader/environment-loader.adapter';
import type { JsLoaderAdapter } from '@infrastructure/loader/js-loader.adapter';
import type { JsonLoaderAdapter } from '@infrastructure/loader/json-loader.adapter';
import type { Json5LoaderAdapter } from '@infrastructure/loader/json5-loader.adapter';
import type { JsoncLoaderAdapter } from '@infrastructure/loader/jsonc-loader.adapter';
import type { PackageJsonLoaderAdapter } from '@infrastructure/loader/package-json-loader.adapter';
import type { LoaderKeyResolverAdapter } from '@infrastructure/loader/resolve-loader-key.adapter';
import type { TomlLoaderAdapter } from '@infrastructure/loader/toml-loader.adapter';
import type { YamlLoaderAdapter } from '@infrastructure/loader/yaml-loader.adapter';
import type { DefaultSearchPlacesResolverAdapter } from '@infrastructure/resolver/create-default-search-places.adapter';
import type { PackagePropertyPathNormalizerAdapter } from '@infrastructure/resolver/normalize-package-property-path.adapter';
import type { SearchCandidatesResolverAdapter } from '@infrastructure/resolver/resolve-search-candidates.adapter';
import type { SearchDirectoriesResolverAdapter } from '@infrastructure/resolver/resolve-search-directories.adapter';
import type { SearchPlacesResolverAdapter } from '@infrastructure/resolver/resolve-search-places.adapter';
import type { SearchStartDirectoryResolverAdapter } from '@infrastructure/resolver/resolve-search-start-directory.adapter';
import type { SearchStrategyResolverAdapter } from '@infrastructure/resolver/resolve-search-strategy.adapter';

import { createToken } from '@elsikora/cladi';

export const CONFIGER_DI_TOKEN: {
  readonly CONFIG_CLIENT_ADAPTER: Token<ConfigClientAdapter<unknown>>;
  readonly CONFIG_CLIENT_SYNC_ADAPTER: Token<ConfigClientSyncAdapter<unknown>>;
  readonly CONFIG_OPTIONS: Token<IConfigOptions>;
  readonly DEEP_MERGE_ADAPTER: Token<DeepMergeAdapter>;
  readonly DEFAULT_LOADER_REGISTRY_FACTORY: Token<DefaultLoaderRegistryFactory>;
  readonly DEFAULT_SEARCH_PLACES_RESOLVER_ADAPTER: Token<DefaultSearchPlacesResolverAdapter>;
  readonly ENVIRONMENT_LOADER_ADAPTER: Token<EnvironmentLoaderAdapter>;
  readonly JS_LOADER_ADAPTER: Token<JsLoaderAdapter>;
  readonly JSON_LOADER_ADAPTER: Token<JsonLoaderAdapter>;
  readonly JSON5_LOADER_ADAPTER: Token<Json5LoaderAdapter>;
  readonly JSONC_LOADER_ADAPTER: Token<JsoncLoaderAdapter>;
  readonly LOADER_KEY_RESOLVER_ADAPTER: Token<LoaderKeyResolverAdapter>;
  readonly LOADER_REGISTRY: Token<TLoaderRegistry>;
  readonly MEMORY_CONFIG_CACHE_ADAPTER: Token<MemoryConfigCacheAdapter<unknown>>;
  readonly PACKAGE_JSON_LOADER_ADAPTER: Token<PackageJsonLoaderAdapter>;
  readonly PACKAGE_PROPERTY_PATH: Token<Array<string>>;
  readonly PACKAGE_PROPERTY_PATH_NORMALIZER_ADAPTER: Token<PackagePropertyPathNormalizerAdapter>;
  readonly RESOLVE_SEARCH_PLAN_USE_CASE: Token<ResolveSearchPlanUseCase>;
  readonly SCHEMA_VALIDATOR_ADAPTER: Token<SchemaValidatorAdapter>;
  readonly SEARCH_CANDIDATES_RESOLVER_ADAPTER: Token<SearchCandidatesResolverAdapter>;
  readonly SEARCH_DIRECTORIES_RESOLVER_ADAPTER: Token<SearchDirectoriesResolverAdapter>;
  readonly SEARCH_PLACES_RESOLVER_ADAPTER: Token<SearchPlacesResolverAdapter>;
  readonly SEARCH_START_DIRECTORY_RESOLVER_ADAPTER: Token<SearchStartDirectoryResolverAdapter>;
  readonly SEARCH_STRATEGY_RESOLVER_ADAPTER: Token<SearchStrategyResolverAdapter>;
  readonly TOML_LOADER_ADAPTER: Token<TomlLoaderAdapter>;
  readonly YAML_LOADER_ADAPTER: Token<YamlLoaderAdapter>;
} = {
  CONFIG_CLIENT_ADAPTER: createToken<ConfigClientAdapter<unknown>>('CONFIG_CLIENT_ADAPTER'),
  CONFIG_CLIENT_SYNC_ADAPTER: createToken<ConfigClientSyncAdapter<unknown>>(
    'CONFIG_CLIENT_SYNC_ADAPTER',
  ),
  CONFIG_OPTIONS: createToken<IConfigOptions>('CONFIG_OPTIONS'),
  DEEP_MERGE_ADAPTER: createToken<DeepMergeAdapter>('DEEP_MERGE_ADAPTER'),
  DEFAULT_LOADER_REGISTRY_FACTORY: createToken<DefaultLoaderRegistryFactory>(
    'DEFAULT_LOADER_REGISTRY_FACTORY',
  ),
  DEFAULT_SEARCH_PLACES_RESOLVER_ADAPTER: createToken<DefaultSearchPlacesResolverAdapter>(
    'DEFAULT_SEARCH_PLACES_RESOLVER_ADAPTER',
  ),
  ENVIRONMENT_LOADER_ADAPTER: createToken<EnvironmentLoaderAdapter>('ENVIRONMENT_LOADER_ADAPTER'),
  JS_LOADER_ADAPTER: createToken<JsLoaderAdapter>('JS_LOADER_ADAPTER'),
  JSON_LOADER_ADAPTER: createToken<JsonLoaderAdapter>('JSON_LOADER_ADAPTER'),
  JSON5_LOADER_ADAPTER: createToken<Json5LoaderAdapter>('JSON5_LOADER_ADAPTER'),
  JSONC_LOADER_ADAPTER: createToken<JsoncLoaderAdapter>('JSONC_LOADER_ADAPTER'),
  LOADER_KEY_RESOLVER_ADAPTER: createToken<LoaderKeyResolverAdapter>('LOADER_KEY_RESOLVER_ADAPTER'),
  LOADER_REGISTRY: createToken<TLoaderRegistry>('LOADER_REGISTRY'),
  MEMORY_CONFIG_CACHE_ADAPTER: createToken<MemoryConfigCacheAdapter<unknown>>(
    'MEMORY_CONFIG_CACHE_ADAPTER',
  ),
  PACKAGE_JSON_LOADER_ADAPTER: createToken<PackageJsonLoaderAdapter>('PACKAGE_JSON_LOADER_ADAPTER'),
  PACKAGE_PROPERTY_PATH: createToken<Array<string>>('PACKAGE_PROPERTY_PATH'),
  PACKAGE_PROPERTY_PATH_NORMALIZER_ADAPTER: createToken<PackagePropertyPathNormalizerAdapter>(
    'PACKAGE_PROPERTY_PATH_NORMALIZER_ADAPTER',
  ),
  RESOLVE_SEARCH_PLAN_USE_CASE: createToken<ResolveSearchPlanUseCase>(
    'RESOLVE_SEARCH_PLAN_USE_CASE',
  ),
  SCHEMA_VALIDATOR_ADAPTER: createToken<SchemaValidatorAdapter>('SCHEMA_VALIDATOR_ADAPTER'),
  SEARCH_CANDIDATES_RESOLVER_ADAPTER: createToken<SearchCandidatesResolverAdapter>(
    'SEARCH_CANDIDATES_RESOLVER_ADAPTER',
  ),
  SEARCH_DIRECTORIES_RESOLVER_ADAPTER: createToken<SearchDirectoriesResolverAdapter>(
    'SEARCH_DIRECTORIES_RESOLVER_ADAPTER',
  ),
  SEARCH_PLACES_RESOLVER_ADAPTER: createToken<SearchPlacesResolverAdapter>(
    'SEARCH_PLACES_RESOLVER_ADAPTER',
  ),
  SEARCH_START_DIRECTORY_RESOLVER_ADAPTER: createToken<SearchStartDirectoryResolverAdapter>(
    'SEARCH_START_DIRECTORY_RESOLVER_ADAPTER',
  ),
  SEARCH_STRATEGY_RESOLVER_ADAPTER: createToken<SearchStrategyResolverAdapter>(
    'SEARCH_STRATEGY_RESOLVER_ADAPTER',
  ),
  TOML_LOADER_ADAPTER: createToken<TomlLoaderAdapter>('TOML_LOADER_ADAPTER'),
  YAML_LOADER_ADAPTER: createToken<YamlLoaderAdapter>('YAML_LOADER_ADAPTER'),
};
