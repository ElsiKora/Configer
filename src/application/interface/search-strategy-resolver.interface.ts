import type { TSearchStrategy } from '@domain/type/search-strategy.type';

export interface ISearchStrategyResolverInterface {
  execute: (
    strategy: TSearchStrategy | undefined,
    stopDirectory: string | undefined,
  ) => TSearchStrategy;
}
