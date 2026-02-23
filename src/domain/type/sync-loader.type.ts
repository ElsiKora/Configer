import type { ILoaderContext } from '@domain/entity/loader.entity';

/**
 * Synchronous loader function contract.
 * @see https://elsikora.dev/configer/docs/api-reference
 */
export type TSyncLoader<TEntity = unknown> = (
  filepath: string,
  content: string,
  context: ILoaderContext,
) => TEntity;
