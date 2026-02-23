import type { ISearchPlacesResolverInterface } from '@application/interface/search-places-resolver.interface';
import type { DefaultSearchPlacesResolverAdapter } from '@infrastructure/resolver/create-default-search-places.adapter';

export class SearchPlacesResolverAdapter implements ISearchPlacesResolverInterface {
  private readonly DEFAULT_SEARCH_PLACES_RESOLVER: DefaultSearchPlacesResolverAdapter;

  public constructor(defaultSearchPlacesResolver: DefaultSearchPlacesResolverAdapter) {
    this.DEFAULT_SEARCH_PLACES_RESOLVER = defaultSearchPlacesResolver;
  }

  public readonly execute = (
    moduleName: string,
    searchPlaces: Array<string> | undefined,
    shouldMergeSearchPlaces: boolean = true,
  ): Array<string> => {
    const defaultSearchPlaces: Array<string> =
      this.DEFAULT_SEARCH_PLACES_RESOLVER.execute(moduleName);

    if (!searchPlaces || searchPlaces.length === 0) {
      return defaultSearchPlaces;
    }

    if (!shouldMergeSearchPlaces) {
      return this.uniqueValues(searchPlaces);
    }

    const mergedSearchPlaces: Array<string> = [...searchPlaces, ...defaultSearchPlaces];

    return this.uniqueValues(mergedSearchPlaces);
  };

  private readonly uniqueValues = (values: Array<string>): Array<string> => {
    const outputValues: Array<string> = [];
    const knownValues: Set<string> = new Set<string>();

    for (const value of values) {
      if (!knownValues.has(value)) {
        outputValues.push(value);
        knownValues.add(value);
      }
    }

    return outputValues;
  };
}
