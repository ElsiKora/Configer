import type { IConfigOptions } from '@domain/entity/config-options.entity';
import type { IDIModule } from '@elsikora/cladi';

import { ResolveSearchPlanUseCase } from '@application/use-case/resolve-search-plan.use-case';
import { createModule } from '@elsikora/cladi';
import { CONFIGER_DI_TOKEN } from '@infrastructure/di/token.constant';
import { DefaultSearchPlacesResolverAdapter } from '@infrastructure/resolver/create-default-search-places.adapter';
import { PackagePropertyPathNormalizerAdapter } from '@infrastructure/resolver/normalize-package-property-path.adapter';
import { SearchCandidatesResolverAdapter } from '@infrastructure/resolver/resolve-search-candidates.adapter';
import { SearchDirectoriesResolverAdapter } from '@infrastructure/resolver/resolve-search-directories.adapter';
import { SearchPlacesResolverAdapter } from '@infrastructure/resolver/resolve-search-places.adapter';
import { SearchStartDirectoryResolverAdapter } from '@infrastructure/resolver/resolve-search-start-directory.adapter';
import { SearchStrategyResolverAdapter } from '@infrastructure/resolver/resolve-search-strategy.adapter';

export const CONFIGER_SEARCH_DI_MODULE: IDIModule = createModule({
  exports: [
    CONFIGER_DI_TOKEN.PACKAGE_PROPERTY_PATH,
    CONFIGER_DI_TOKEN.RESOLVE_SEARCH_PLAN_USE_CASE,
  ],
  name: 'configer-search',
  providers: [
    {
      provide: CONFIGER_DI_TOKEN.PACKAGE_PROPERTY_PATH_NORMALIZER_ADAPTER,
      useFactory: (): PackagePropertyPathNormalizerAdapter => {
        return new PackagePropertyPathNormalizerAdapter();
      },
    },
    {
      provide: CONFIGER_DI_TOKEN.SEARCH_CANDIDATES_RESOLVER_ADAPTER,
      useFactory: (): SearchCandidatesResolverAdapter => {
        return new SearchCandidatesResolverAdapter();
      },
    },
    {
      provide: CONFIGER_DI_TOKEN.SEARCH_DIRECTORIES_RESOLVER_ADAPTER,
      useFactory: (): SearchDirectoriesResolverAdapter => {
        return new SearchDirectoriesResolverAdapter();
      },
    },
    {
      provide: CONFIGER_DI_TOKEN.DEFAULT_SEARCH_PLACES_RESOLVER_ADAPTER,
      useFactory: (): DefaultSearchPlacesResolverAdapter => {
        return new DefaultSearchPlacesResolverAdapter();
      },
    },
    {
      deps: [CONFIGER_DI_TOKEN.DEFAULT_SEARCH_PLACES_RESOLVER_ADAPTER],
      provide: CONFIGER_DI_TOKEN.SEARCH_PLACES_RESOLVER_ADAPTER,
      useFactory: (
        defaultSearchPlacesResolverAdapter: DefaultSearchPlacesResolverAdapter,
      ): SearchPlacesResolverAdapter => {
        return new SearchPlacesResolverAdapter(defaultSearchPlacesResolverAdapter);
      },
    },
    {
      provide: CONFIGER_DI_TOKEN.SEARCH_START_DIRECTORY_RESOLVER_ADAPTER,
      useFactory: (): SearchStartDirectoryResolverAdapter => {
        return new SearchStartDirectoryResolverAdapter();
      },
    },
    {
      provide: CONFIGER_DI_TOKEN.SEARCH_STRATEGY_RESOLVER_ADAPTER,
      useFactory: (): SearchStrategyResolverAdapter => {
        return new SearchStrategyResolverAdapter();
      },
    },
    {
      deps: [
        CONFIGER_DI_TOKEN.PACKAGE_PROPERTY_PATH_NORMALIZER_ADAPTER,
        CONFIGER_DI_TOKEN.SEARCH_CANDIDATES_RESOLVER_ADAPTER,
        CONFIGER_DI_TOKEN.SEARCH_DIRECTORIES_RESOLVER_ADAPTER,
        CONFIGER_DI_TOKEN.SEARCH_PLACES_RESOLVER_ADAPTER,
        CONFIGER_DI_TOKEN.SEARCH_START_DIRECTORY_RESOLVER_ADAPTER,
        CONFIGER_DI_TOKEN.SEARCH_STRATEGY_RESOLVER_ADAPTER,
      ],
      provide: CONFIGER_DI_TOKEN.RESOLVE_SEARCH_PLAN_USE_CASE,
      useFactory: (
        packagePropertyPathNormalizerAdapter: PackagePropertyPathNormalizerAdapter,
        searchCandidatesResolverAdapter: SearchCandidatesResolverAdapter,
        searchDirectoriesResolverAdapter: SearchDirectoriesResolverAdapter,
        searchPlacesResolverAdapter: SearchPlacesResolverAdapter,
        searchStartDirectoryResolverAdapter: SearchStartDirectoryResolverAdapter,
        searchStrategyResolverAdapter: SearchStrategyResolverAdapter,
      ): ResolveSearchPlanUseCase => {
        return new ResolveSearchPlanUseCase(
          packagePropertyPathNormalizerAdapter,
          searchCandidatesResolverAdapter,
          searchDirectoriesResolverAdapter,
          searchPlacesResolverAdapter,
          searchStartDirectoryResolverAdapter,
          searchStrategyResolverAdapter,
        );
      },
    },
    {
      deps: [
        CONFIGER_DI_TOKEN.PACKAGE_PROPERTY_PATH_NORMALIZER_ADAPTER,
        CONFIGER_DI_TOKEN.CONFIG_OPTIONS,
      ],
      provide: CONFIGER_DI_TOKEN.PACKAGE_PROPERTY_PATH,
      useFactory: (
        packagePropertyPathNormalizerAdapter: PackagePropertyPathNormalizerAdapter,
        options: IConfigOptions,
      ): Array<string> => {
        return packagePropertyPathNormalizerAdapter.execute(
          options.packageProperty,
          options.moduleName,
        );
      },
    },
  ],
});
