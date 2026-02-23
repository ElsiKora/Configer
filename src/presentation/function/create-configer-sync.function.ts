import type { IConfigClientSync } from '@domain/entity/config-client-sync.entity';
import type { IConfigOptions } from '@domain/entity/config-options.entity';

import { ConfigClientFactory } from '@infrastructure/di/config-client.factory';

/**
 * Creates a synchronous Configer client instance.
 * @param {IConfigOptions<unknown>} options - Runtime options used for config discovery and loading.
 * @returns {IConfigClientSync<unknown>} Sync config client.
 * @see https://elsikora.dev/configer/docs/api-reference
 */
export const createConfigerSync = <TEntity>(
  options: IConfigOptions<TEntity>,
): IConfigClientSync<TEntity> => {
  const configClientFactory: ConfigClientFactory = new ConfigClientFactory();

  return configClientFactory.createSync(options);
};
