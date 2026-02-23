import type { IConfigClientSync } from '@domain/entity/config-client-sync.entity';
import type { IConfigClient } from '@domain/entity/config-client.entity';
import type { IConfigOptions } from '@domain/entity/config-options.entity';
import type { IDIContainer } from '@elsikora/cladi';
import type { ConfigClientSyncAdapter } from '@infrastructure/adapter/config-client-sync.adapter';
import type { ConfigClientAdapter } from '@infrastructure/adapter/config-client.adapter';

import { createConfigClientContainer } from '@infrastructure/di/container.factory';
import { CONFIGER_DI_TOKEN } from '@infrastructure/di/token.constant';

export class ConfigClientFactory {
  public readonly createAsync = <TEntity>(
    options: IConfigOptions<TEntity>,
  ): IConfigClient<TEntity> => {
    const container: IDIContainer = createConfigClientContainer(options);

    return container.resolve(
      CONFIGER_DI_TOKEN.CONFIG_CLIENT_ADAPTER,
    ) as ConfigClientAdapter<TEntity>;
  };

  public readonly createSync = <TEntity>(
    options: IConfigOptions<TEntity>,
  ): IConfigClientSync<TEntity> => {
    const container: IDIContainer = createConfigClientContainer(options);

    return container.resolve(
      CONFIGER_DI_TOKEN.CONFIG_CLIENT_SYNC_ADAPTER,
    ) as ConfigClientSyncAdapter<TEntity>;
  };
}
