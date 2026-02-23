import type { ILoaderContext } from '@domain/entity/loader.entity';

/**
 * Asynchronous loader function contract.
 * @see https://elsikora.dev/configer/docs/api-reference
 */
export type TAsyncLoader<TEntity = unknown> = (
  filepath: string,
  content: string,
  context: ILoaderContext,
) => Promise<TEntity> | TEntity;
