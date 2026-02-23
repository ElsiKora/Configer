import type { IConfigResult } from '@domain/entity/config-result.entity';

/**
 * Synchronous configuration client contract.
 * @see https://elsikora.dev/configer/docs/api-reference
 */
export interface IConfigClientSync<TEntity> {
  clearCaches: () => void;
  clearFindCache: () => void;
  clearReadCache: () => void;
  findConfig: (searchFrom?: string) => IConfigResult<TEntity> | null;
  readConfig: (filepath: string) => IConfigResult<TEntity>;
}
