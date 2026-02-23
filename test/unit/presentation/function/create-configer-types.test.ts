import type { IConfigClientSync } from '@domain/entity/config-client-sync.entity';
import type { IConfigClient } from '@domain/entity/config-client.entity';
import type { IConfigResult } from '@domain/entity/config-result.entity';

import { createConfiger, createConfigerSync } from '@src/index';
import { describe, expectTypeOf, it } from 'vitest';

describe('Configer typing', () => {
  it('preserves generic config type for async and sync clients', () => {
    const asyncClient: IConfigClient<{ isEnabled: boolean; name: string }> = createConfiger<{
      isEnabled: boolean;
      name: string;
    }>({
      moduleName: 'app',
    });

    const syncClient: IConfigClientSync<{ isEnabled: boolean; name: string }> = createConfigerSync<{
      isEnabled: boolean;
      name: string;
    }>({
      moduleName: 'app',
    });

    expectTypeOf(asyncClient.readConfig).returns.resolves.toEqualTypeOf<
      IConfigResult<{ isEnabled: boolean; name: string }>
    >();
    expectTypeOf(syncClient.readConfig).returns.toEqualTypeOf<
      IConfigResult<{ isEnabled: boolean; name: string }>
    >();
  });
});
