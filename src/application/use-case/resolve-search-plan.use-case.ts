import type { IResolveSearchPlanInputDto } from '@application/dto/resolve-search-plan.input.dto';
import type { IResolveSearchPlanOutputDto } from '@application/dto/resolve-search-plan.output.dto';
import type { IPackagePropertyPathNormalizerInterface } from '@application/interface/package-property-path-normalizer.interface';
import type { ISearchCandidatesResolverInterface } from '@application/interface/search-candidates-resolver.interface';
import type { ISearchDirectoriesResolverInterface } from '@application/interface/search-directories-resolver.interface';
import type { ISearchPlacesResolverInterface } from '@application/interface/search-places-resolver.interface';
import type { ISearchStartDirectoryResolverInterface } from '@application/interface/search-start-directory-resolver.interface';
import type { ISearchStrategyResolverInterface } from '@application/interface/search-strategy-resolver.interface';
import type { TSearchStrategy } from '@domain/type/search-strategy.type';

export class ResolveSearchPlanUseCase {
  private readonly PACKAGE_PROPERTY_PATH_NORMALIZER: IPackagePropertyPathNormalizerInterface;

  private readonly SEARCH_CANDIDATES_RESOLVER: ISearchCandidatesResolverInterface;

  private readonly SEARCH_DIRECTORIES_RESOLVER: ISearchDirectoriesResolverInterface;

  private readonly SEARCH_PLACES_RESOLVER: ISearchPlacesResolverInterface;

  private readonly SEARCH_START_DIRECTORY_RESOLVER: ISearchStartDirectoryResolverInterface;

  private readonly SEARCH_STRATEGY_RESOLVER: ISearchStrategyResolverInterface;

  public constructor(
    packagePropertyPathNormalizer: IPackagePropertyPathNormalizerInterface,
    searchCandidatesResolver: ISearchCandidatesResolverInterface,
    searchDirectoriesResolver: ISearchDirectoriesResolverInterface,
    searchPlacesResolver: ISearchPlacesResolverInterface,
    searchStartDirectoryResolver: ISearchStartDirectoryResolverInterface,
    searchStrategyResolver: ISearchStrategyResolverInterface,
  ) {
    this.PACKAGE_PROPERTY_PATH_NORMALIZER = packagePropertyPathNormalizer;
    this.SEARCH_CANDIDATES_RESOLVER = searchCandidatesResolver;
    this.SEARCH_DIRECTORIES_RESOLVER = searchDirectoriesResolver;
    this.SEARCH_PLACES_RESOLVER = searchPlacesResolver;
    this.SEARCH_START_DIRECTORY_RESOLVER = searchStartDirectoryResolver;
    this.SEARCH_STRATEGY_RESOLVER = searchStrategyResolver;
  }

  public readonly execute = (input: IResolveSearchPlanInputDto): IResolveSearchPlanOutputDto => {
    const resolvedSearchStrategy: TSearchStrategy = this.SEARCH_STRATEGY_RESOLVER.execute(
      input.searchStrategy,
      input.stopDirectory,
    );

    const packagePropertyPath: Array<string> = this.PACKAGE_PROPERTY_PATH_NORMALIZER.execute(
      input.packageProperty,
      input.moduleName,
    );

    const resolvedSearchPlaces: Array<string> = this.SEARCH_PLACES_RESOLVER.execute(
      input.moduleName,
      input.searchPlaces,
      input.shouldMergeSearchPlaces,
    );

    const searchStartDirectory: string = this.SEARCH_START_DIRECTORY_RESOLVER.execute(
      input.cwd,
      input.searchFrom,
    );

    const directoryCandidates: Array<string> = this.SEARCH_DIRECTORIES_RESOLVER.execute(
      searchStartDirectory,
      resolvedSearchStrategy,
      input.moduleName,
      input.stopDirectory,
    );

    const candidateFilepaths: Array<string> = this.SEARCH_CANDIDATES_RESOLVER.execute(
      directoryCandidates,
      resolvedSearchPlaces,
    );

    return {
      candidateFilepaths,
      directoryCandidates,
      packagePropertyPath,
      resolvedSearchPlaces,
      resolvedSearchStrategy,
      searchStartDirectory,
    };
  };
}
