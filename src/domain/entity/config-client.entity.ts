import type { IConfigResult } from '@domain/entity/config-result.entity';
import type { IWatchHandle } from '@domain/entity/watch-handle.entity';
import type { TWatchConfigCallback } from '@domain/type/watch-config-callback.type';

/**
 * Async configuration client contract.
 * @see https://elsikora.dev/configer/docs/api-reference
 */
export interface IConfigClient<TEntity> {
  clearCaches: () => void;
  clearFindCache: () => void;
  clearReadCache: () => void;
  findConfig: (searchFrom?: string) => Promise<IConfigResult<TEntity> | null>;
  readConfig: (filepath: string) => Promise<IConfigResult<TEntity>>;
  watchConfig: (callback: TWatchConfigCallback<TEntity>) => IWatchHandle;
}
