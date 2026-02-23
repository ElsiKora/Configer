import type { Token } from '@elsikora/cladi';

import { CONFIGER_DI_TOKEN } from '@infrastructure/di/token.constant';
import { describe, expect, it } from 'vitest';

describe('CONFIGER_DI_TOKEN', () => {
  it('defines core tokens', () => {
    expect(CONFIGER_DI_TOKEN.CONFIG_OPTIONS).toBeDefined();
    expect(CONFIGER_DI_TOKEN.LOADER_REGISTRY).toBeDefined();
    expect(CONFIGER_DI_TOKEN.CONFIG_CLIENT_ADAPTER).toBeDefined();
    expect(CONFIGER_DI_TOKEN.CONFIG_CLIENT_SYNC_ADAPTER).toBeDefined();
    expect(CONFIGER_DI_TOKEN.RESOLVE_SEARCH_PLAN_USE_CASE).toBeDefined();
  });

  it('contains unique token references', () => {
    const references: Array<Token<unknown>> = Object.values(CONFIGER_DI_TOKEN) as Array<
      Token<unknown>
    >;
    const uniqueReferences: Set<Token<unknown>> = new Set<Token<unknown>>(references);

    expect(uniqueReferences.size).toBe(references.length);
  });
});
