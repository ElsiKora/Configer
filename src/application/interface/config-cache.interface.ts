import type { IConfigResult } from '@domain/entity/config-result.entity';

export interface IConfigCacheInterface<TEntity> {
  clearAll: () => void;
  clearFindCache: () => void;
  clearReadCache: () => void;
  getFindResult: (cacheKey: string) => IConfigResult<TEntity> | null | undefined;
  getReadResult: (cacheKey: string) => IConfigResult<TEntity> | undefined;
  setFindResult: (cacheKey: string, result: IConfigResult<TEntity> | null) => void;
  setReadResult: (cacheKey: string, result: IConfigResult<TEntity>) => void;
}
