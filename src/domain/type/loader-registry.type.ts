import type { ILoaderRegistryEntry } from '@domain/entity/loader-registry-entry.entity';

/**
 * Loader registry keyed by extension or reserved config key.
 * @see https://elsikora.dev/configer/docs/api-reference
 */
export type TLoaderRegistry<TEntity = unknown> = Record<string, ILoaderRegistryEntry<TEntity>>;
