import type { IConfigClient } from '@domain/entity/config-client.entity';
import type { IConfigOptions } from '@domain/entity/config-options.entity';

import { ConfigClientFactory } from '@infrastructure/di/config-client.factory';

/**
 * Creates an asynchronous Configer client instance.
 * @param {IConfigOptions<unknown>} options - Runtime options used for config discovery and loading.
 * @returns {IConfigClient<unknown>} Async config client.
 * @see https://elsikora.dev/configer/docs/api-reference
 */
export const createConfiger = <TEntity>(
  options: IConfigOptions<TEntity>,
): IConfigClient<TEntity> => {
  const configClientFactory: ConfigClientFactory = new ConfigClientFactory();

  return configClientFactory.createAsync(options);
};
