import type { IConfigOptions } from '@domain/entity/config-options.entity';
import type { ILoaderRegistryEntry } from '@domain/entity/loader-registry-entry.entity';
import type { TLoaderRegistry } from '@domain/type/loader-registry.type';
import type { IDIContainer } from '@elsikora/cladi';
import type { ConfigClientSyncAdapter } from '@infrastructure/adapter/config-client-sync.adapter';
import type { ConfigClientAdapter } from '@infrastructure/adapter/config-client.adapter';

import { createConfigClientContainer } from '@infrastructure/di/container.factory';
import { CONFIGER_DI_TOKEN } from '@infrastructure/di/token.constant';
import { describe, expect, it } from 'vitest';

const createOptions = (): IConfigOptions => {
  return {
    moduleName: 'app',
  };
};

describe('createConfigClientContainer', () => {
  it('resolves async and sync clients from DI graph', () => {
    const container: IDIContainer = createConfigClientContainer(createOptions());

    const configClientAdapter: ConfigClientAdapter<unknown> = container.resolve(
      CONFIGER_DI_TOKEN.CONFIG_CLIENT_ADAPTER,
    );

    const configClientSyncAdapter: ConfigClientSyncAdapter<unknown> = container.resolve(
      CONFIGER_DI_TOKEN.CONFIG_CLIENT_SYNC_ADAPTER,
    );

    expect(typeof configClientAdapter.findConfig).toBe('function');
    expect(typeof configClientAdapter.readConfig).toBe('function');
    expect(typeof configClientSyncAdapter.findConfig).toBe('function');
    expect(typeof configClientSyncAdapter.readConfig).toBe('function');
  });

  it('merges user-provided loaders into loader registry', () => {
    const customLoader: ILoaderRegistryEntry = {
      asyncLoader: (): Promise<unknown> => {
        return Promise.resolve({ source: 'custom' });
      },
      syncLoader: (): unknown => {
        return { source: 'custom' };
      },
    };

    const options: IConfigOptions = {
      loaders: {
        '.custom': customLoader,
      },
      moduleName: 'app',
    };

    const container: IDIContainer = createConfigClientContainer(options);
    const loaderRegistry: TLoaderRegistry = container.resolve(CONFIGER_DI_TOKEN.LOADER_REGISTRY);

    expect(loaderRegistry['.custom']).toBe(customLoader);
    expect(loaderRegistry['.json']).toBeDefined();
  });

  it('normalizes package property path token from options', () => {
    const options: IConfigOptions = {
      moduleName: 'app',
      packageProperty: 'config.app.settings',
    };

    const container: IDIContainer = createConfigClientContainer(options);

    const packagePropertyPath: Array<string> = container.resolve(
      CONFIGER_DI_TOKEN.PACKAGE_PROPERTY_PATH,
    );

    expect(packagePropertyPath).toEqual(['config', 'app', 'settings']);
  });
});
