import type { IConfigOptions } from '@domain/entity/config-options.entity';
import type { TLoaderRegistry } from '@domain/type/loader-registry.type';
import type { IDIContainer } from '@elsikora/cladi';
import type { ConfigClientAdapter } from '@infrastructure/adapter/config-client.adapter';

import {
  createTestingContainer,
  mockProvider,
  overrideProvider,
  resetTestingContainer,
} from '@elsikora/cladi-testing';
import { CONFIGER_CLIENT_DI_MODULE } from '@infrastructure/di/client.module';
import { CONFIGER_LOADER_DI_MODULE } from '@infrastructure/di/loader.module';
import { CONFIGER_DI_MODULE } from '@infrastructure/di/module';
import { CONFIGER_SEARCH_DI_MODULE } from '@infrastructure/di/search.module';
import { CONFIGER_DI_TOKEN } from '@infrastructure/di/token.constant';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

const createOptions = (): IConfigOptions => {
  return {
    moduleName: 'app',
  };
};

let container: IDIContainer;

beforeEach(() => {
  container = createTestingContainer({
    modules: [CONFIGER_DI_MODULE],
    providers: [mockProvider(CONFIGER_DI_TOKEN.CONFIG_OPTIONS, createOptions())],
    shouldValidateOnCreate: true,
  });
});

afterEach(async () => {
  await resetTestingContainer(container);
});

describe('Configer DI modules', () => {
  it('wires root module to client module', () => {
    expect(CONFIGER_DI_MODULE.name).toBe('configer');
    expect(CONFIGER_DI_MODULE.imports).toContain(CONFIGER_CLIENT_DI_MODULE);
    expect(CONFIGER_DI_MODULE.exports).toContain(CONFIGER_DI_TOKEN.CONFIG_CLIENT_ADAPTER);
    expect(CONFIGER_DI_MODULE.exports).toContain(CONFIGER_DI_TOKEN.CONFIG_CLIENT_SYNC_ADAPTER);
    expect(CONFIGER_DI_MODULE.exports).toContain(CONFIGER_DI_TOKEN.LOADER_REGISTRY);
  });

  it('registers loader providers in loader module', () => {
    expect(CONFIGER_LOADER_DI_MODULE.name).toBe('configer-loader');
    expect(CONFIGER_LOADER_DI_MODULE.exports).toContain(
      CONFIGER_DI_TOKEN.LOADER_KEY_RESOLVER_ADAPTER,
    );
    expect(CONFIGER_LOADER_DI_MODULE.exports).toContain(CONFIGER_DI_TOKEN.LOADER_REGISTRY);
  });

  it('registers search providers in search module', () => {
    expect(CONFIGER_SEARCH_DI_MODULE.name).toBe('configer-search');
    expect(CONFIGER_SEARCH_DI_MODULE.exports).toContain(CONFIGER_DI_TOKEN.PACKAGE_PROPERTY_PATH);
    expect(CONFIGER_SEARCH_DI_MODULE.exports).toContain(
      CONFIGER_DI_TOKEN.RESOLVE_SEARCH_PLAN_USE_CASE,
    );
  });

  it('registers client module and resolves runtime tokens', () => {
    expect(CONFIGER_CLIENT_DI_MODULE.name).toBe('configer-client');
    expect(CONFIGER_CLIENT_DI_MODULE.imports).toContain(CONFIGER_LOADER_DI_MODULE);
    expect(CONFIGER_CLIENT_DI_MODULE.imports).toContain(CONFIGER_SEARCH_DI_MODULE);

    const loaderRegistry: TLoaderRegistry = container.resolve(CONFIGER_DI_TOKEN.LOADER_REGISTRY);

    expect(loaderRegistry['.json']).toBeDefined();
    expect(loaderRegistry['.yaml']).toBeDefined();
    expect(loaderRegistry['package.json']).toBeDefined();
  });

  it('supports provider overrides via cladi-testing', async () => {
    const mockedClientAdapter: ConfigClientAdapter<unknown> = {} as ConfigClientAdapter<unknown>;

    await overrideProvider(
      container,
      mockProvider(CONFIGER_DI_TOKEN.CONFIG_CLIENT_ADAPTER, mockedClientAdapter),
    );

    const resolvedClientAdapter: ConfigClientAdapter<unknown> = container.resolve(
      CONFIGER_DI_TOKEN.CONFIG_CLIENT_ADAPTER,
    );

    expect(resolvedClientAdapter).toBe(mockedClientAdapter);
  });
});
