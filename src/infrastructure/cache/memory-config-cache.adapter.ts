import type { IConfigCacheInterface } from '@application/interface/config-cache.interface';
import type { IConfigResult } from '@domain/entity/config-result.entity';

export class MemoryConfigCacheAdapter<TEntity> implements IConfigCacheInterface<TEntity> {
  private readonly FIND_CACHE: Map<string, IConfigResult<TEntity> | null>;

  private readonly READ_CACHE: Map<string, IConfigResult<TEntity>>;

  public constructor() {
    this.FIND_CACHE = new Map<string, IConfigResult<TEntity> | null>();
    this.READ_CACHE = new Map<string, IConfigResult<TEntity>>();
  }

  public readonly clearAll = (): void => {
    this.clearFindCache();
    this.clearReadCache();
  };

  public readonly clearFindCache = (): void => {
    this.FIND_CACHE.clear();
  };

  public readonly clearReadCache = (): void => {
    this.READ_CACHE.clear();
  };

  public readonly getFindResult = (cacheKey: string): IConfigResult<TEntity> | null | undefined => {
    return this.FIND_CACHE.get(cacheKey);
  };

  public readonly getReadResult = (cacheKey: string): IConfigResult<TEntity> | undefined => {
    return this.READ_CACHE.get(cacheKey);
  };

  public readonly setFindResult = (
    cacheKey: string,
    result: IConfigResult<TEntity> | null,
  ): void => {
    this.FIND_CACHE.set(cacheKey, result);
  };

  public readonly setReadResult = (cacheKey: string, result: IConfigResult<TEntity>): void => {
    this.READ_CACHE.set(cacheKey, result);
  };
}
