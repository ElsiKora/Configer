import type { IConfigResult } from '@domain/entity/config-result.entity';
import type { IPluginContext } from '@domain/entity/plugin-context.entity';

/**
 * Plugin hook contract for extending Configer behavior.
 * @see https://elsikora.dev/configer/docs/api-reference
 */
export interface IConfigPlugin<TEntity = unknown> {
  afterFind?: (
    result: IConfigResult<TEntity> | null,
    context: IPluginContext,
  ) => IConfigResult<TEntity> | null | Promise<IConfigResult<TEntity> | null>;
  afterRead?: (
    result: IConfigResult<TEntity>,
    context: IPluginContext,
  ) => IConfigResult<TEntity> | Promise<IConfigResult<TEntity>>;
  beforeFind?: (context: IPluginContext) => IPluginContext | Promise<IPluginContext>;
  beforeRead?: (context: IPluginContext) => IPluginContext | Promise<IPluginContext>;
  name: string;
  onError?: (error: Error, context: IPluginContext) => Promise<void> | void;
}
