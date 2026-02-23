import type { TAsyncLoader } from '@domain/type/async-loader.type';
import type { TSyncLoader } from '@domain/type/sync-loader.type';

/**
 * Loader registry item with async and optional sync handlers.
 * @see https://elsikora.dev/configer/docs/api-reference
 */
export interface ILoaderRegistryEntry<TEntity = unknown> {
  asyncLoader: TAsyncLoader<TEntity>;
  syncLoader?: TSyncLoader<TEntity>;
}
