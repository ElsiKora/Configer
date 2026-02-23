export interface ISearchPlacesResolverInterface {
  execute: (
    moduleName: string,
    searchPlaces: Array<string> | undefined,
    shouldMergeSearchPlaces?: boolean,
  ) => Array<string>;
}
