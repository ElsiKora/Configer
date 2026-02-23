export interface ISearchStartDirectoryResolverInterface {
  execute: (cwd: string, searchFrom: string | undefined) => string;
}
