import type { IConfigFunctionContext } from '@domain/entity/config-function-context.entity';

/**
 * Config factory contract for function-based configuration modules.
 * @see https://elsikora.dev/configer/docs/api-reference
 */
export type TConfigFactory<TEntity = unknown> = (
  context: IConfigFunctionContext,
) => Promise<TEntity> | TEntity;
