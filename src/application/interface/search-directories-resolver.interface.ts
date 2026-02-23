import type { TSearchStrategy } from '@domain/type/search-strategy.type';

export interface ISearchDirectoriesResolverInterface {
  execute: (
    startDirectory: string,
    strategy: TSearchStrategy,
    moduleName: string,
    stopDirectory: string | undefined,
  ) => Array<string>;
}
