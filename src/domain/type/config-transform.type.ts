import type { IConfigResult } from '@domain/entity/config-result.entity';

/**
 * Final config transform contract.
 * @see https://elsikora.dev/configer/docs/api-reference
 */
export type TConfigTransform<TEntity> = (
  result: IConfigResult<TEntity>,
) => IConfigResult<TEntity> | Promise<IConfigResult<TEntity>>;
