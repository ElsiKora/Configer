import type { IConfigCacheInterface } from '@application/interface/config-cache.interface';
import type { ResolveSearchPlanUseCase } from '@application/use-case/resolve-search-plan.use-case';
import type { IConfigOptions } from '@domain/entity/config-options.entity';
import type { TLoaderRegistry } from '@domain/type/loader-registry.type';
import type { IDIModule } from '@elsikora/cladi';
import type { LoaderKeyResolverAdapter } from '@infrastructure/loader/resolve-loader-key.adapter';

import { createModule } from '@elsikora/cladi';
import { ConfigClientSyncAdapter } from '@infrastructure/adapter/config-client-sync.adapter';
import { ConfigClientAdapter } from '@infrastructure/adapter/config-client.adapter';
import { DeepMergeAdapter } from '@infrastructure/adapter/deep-merge.adapter';
import { SchemaValidatorAdapter } from '@infrastructure/adapter/schema-validator.adapter';
import { MemoryConfigCacheAdapter } from '@infrastructure/cache/memory-config-cache.adapter';
import { CONFIGER_LOADER_DI_MODULE } from '@infrastructure/di/loader.module';
import { CONFIGER_SEARCH_DI_MODULE } from '@infrastructure/di/search.module';
import { CONFIGER_DI_TOKEN } from '@infrastructure/di/token.constant';

export const CONFIGER_CLIENT_DI_MODULE: IDIModule = createModule({
  exports: [
    CONFIGER_DI_TOKEN.CONFIG_CLIENT_ADAPTER,
    CONFIGER_DI_TOKEN.CONFIG_CLIENT_SYNC_ADAPTER,
    CONFIGER_DI_TOKEN.LOADER_REGISTRY,
  ],
  imports: [CONFIGER_LOADER_DI_MODULE, CONFIGER_SEARCH_DI_MODULE],
  name: 'configer-client',
  providers: [
    {
      provide: CONFIGER_DI_TOKEN.MEMORY_CONFIG_CACHE_ADAPTER,
      useFactory: (): IConfigCacheInterface<unknown> => {
        return new MemoryConfigCacheAdapter();
      },
    },
    {
      provide: CONFIGER_DI_TOKEN.DEEP_MERGE_ADAPTER,
      useFactory: (): DeepMergeAdapter => {
        return new DeepMergeAdapter();
      },
    },
    {
      provide: CONFIGER_DI_TOKEN.SCHEMA_VALIDATOR_ADAPTER,
      useFactory: (): SchemaValidatorAdapter => {
        return new SchemaValidatorAdapter();
      },
    },
    {
      deps: [
        CONFIGER_DI_TOKEN.MEMORY_CONFIG_CACHE_ADAPTER,
        CONFIGER_DI_TOKEN.DEEP_MERGE_ADAPTER,
        CONFIGER_DI_TOKEN.LOADER_KEY_RESOLVER_ADAPTER,
        CONFIGER_DI_TOKEN.LOADER_REGISTRY,
        CONFIGER_DI_TOKEN.CONFIG_OPTIONS,
        CONFIGER_DI_TOKEN.PACKAGE_PROPERTY_PATH,
        CONFIGER_DI_TOKEN.RESOLVE_SEARCH_PLAN_USE_CASE,
        CONFIGER_DI_TOKEN.SCHEMA_VALIDATOR_ADAPTER,
      ],
      provide: CONFIGER_DI_TOKEN.CONFIG_CLIENT_ADAPTER,
      useFactory: (
        configCache: IConfigCacheInterface<unknown>,
        deepMergeAdapter: DeepMergeAdapter,
        loaderKeyResolverAdapter: LoaderKeyResolverAdapter,
        loaderRegistry: TLoaderRegistry,
        options: IConfigOptions,
        packagePropertyPath: Array<string>,
        resolveSearchPlanUseCase: ResolveSearchPlanUseCase,
        schemaValidatorAdapter: SchemaValidatorAdapter,
      ): ConfigClientAdapter<unknown> => {
        return new ConfigClientAdapter(
          configCache,
          deepMergeAdapter,
          loaderKeyResolverAdapter,
          loaderRegistry,
          options,
          packagePropertyPath,
          resolveSearchPlanUseCase,
          schemaValidatorAdapter,
        );
      },
    },
    {
      deps: [CONFIGER_DI_TOKEN.CONFIG_CLIENT_ADAPTER],
      provide: CONFIGER_DI_TOKEN.CONFIG_CLIENT_SYNC_ADAPTER,
      useFactory: (
        configClientAdapter: ConfigClientAdapter<unknown>,
      ): ConfigClientSyncAdapter<unknown> => {
        return new ConfigClientSyncAdapter(configClientAdapter);
      },
    },
  ],
});
