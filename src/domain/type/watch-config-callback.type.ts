import type { IConfigResult } from '@domain/entity/config-result.entity';

/**
 * Callback contract for watch mode updates.
 * @see https://elsikora.dev/configer/docs/api-reference
 */
export type TWatchConfigCallback<TEntity> = (
  error: Error | null,
  result: IConfigResult<TEntity> | null,
) => void;
