import type { ISearchStrategyResolverInterface } from '@application/interface/search-strategy-resolver.interface';
import type { TSearchStrategy } from '@domain/type/search-strategy.type';

export class SearchStrategyResolverAdapter implements ISearchStrategyResolverInterface {
  public readonly execute = (
    strategy: TSearchStrategy | undefined,
    stopDirectory: string | undefined,
  ): TSearchStrategy => {
    if (strategy) {
      return strategy;
    }

    return stopDirectory ? 'global' : 'none';
  };
}
