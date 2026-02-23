import type { IConfigClientSync } from '@domain/entity/config-client-sync.entity';
import type { IConfigResult } from '@domain/entity/config-result.entity';
import type { ConfigClientAdapter } from '@infrastructure/adapter/config-client.adapter';

export class ConfigClientSyncAdapter<TEntity> implements IConfigClientSync<TEntity> {
  private readonly CONFIG_CLIENT_ADAPTER: ConfigClientAdapter<TEntity>;

  public constructor(configClientAdapter: ConfigClientAdapter<TEntity>) {
    this.CONFIG_CLIENT_ADAPTER = configClientAdapter;
  }

  public readonly clearCaches = (): void => {
    this.CONFIG_CLIENT_ADAPTER.clearCaches();
  };

  public readonly clearFindCache = (): void => {
    this.CONFIG_CLIENT_ADAPTER.clearFindCache();
  };

  public readonly clearReadCache = (): void => {
    this.CONFIG_CLIENT_ADAPTER.clearReadCache();
  };

  public readonly findConfig = (searchFrom?: string): IConfigResult<TEntity> | null => {
    return this.CONFIG_CLIENT_ADAPTER.findConfigSync(searchFrom);
  };

  public readonly readConfig = (filepath: string): IConfigResult<TEntity> => {
    return this.CONFIG_CLIENT_ADAPTER.readConfigSync(filepath);
  };
}
