export interface ISearchCandidatesResolverInterface {
  execute: (directories: Array<string>, searchPlaces: Array<string>) => Array<string>;
}
