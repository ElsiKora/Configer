import type { IConfigResult } from '@domain/entity/config-result.entity';

import { MemoryConfigCacheAdapter } from '@infrastructure/cache/memory-config-cache.adapter';
import { describe, expect, it } from 'vitest';

describe('MemoryConfigCacheAdapter', () => {
  it('stores and retrieves find results', () => {
    const cacheAdapter: MemoryConfigCacheAdapter<{ value: number }> = new MemoryConfigCacheAdapter<{
      value: number;
    }>();

    const findResult: IConfigResult<{ value: number }> = {
      config: { value: 1 },
      filepath: '/safe/project/.apprc.json',
    };

    cacheAdapter.setFindResult('key-a', findResult);

    const cachedResult: IConfigResult<{ value: number }> | null | undefined =
      cacheAdapter.getFindResult('key-a');

    expect(cachedResult).toEqual(findResult);
  });

  it('stores and retrieves read results', () => {
    const cacheAdapter: MemoryConfigCacheAdapter<{ value: string }> = new MemoryConfigCacheAdapter<{
      value: string;
    }>();

    const readResult: IConfigResult<{ value: string }> = {
      config: { value: 'hello' },
      filepath: '/safe/project/config.json',
    };

    cacheAdapter.setReadResult('read-key-a', readResult);

    const cachedResult: IConfigResult<{ value: string }> | undefined =
      cacheAdapter.getReadResult('read-key-a');

    expect(cachedResult).toEqual(readResult);
  });

  it('returns undefined for missing cache entries', () => {
    const cacheAdapter: MemoryConfigCacheAdapter<unknown> = new MemoryConfigCacheAdapter<unknown>();

    expect(cacheAdapter.getFindResult('missing')).toBeUndefined();
    expect(cacheAdapter.getReadResult('missing')).toBeUndefined();
  });

  it('stores null find result correctly', () => {
    const cacheAdapter: MemoryConfigCacheAdapter<unknown> = new MemoryConfigCacheAdapter<unknown>();

    cacheAdapter.setFindResult('null-key', null);

    expect(cacheAdapter.getFindResult('null-key')).toBeNull();
  });

  it('clears find cache only', () => {
    const cacheAdapter: MemoryConfigCacheAdapter<{ value: number }> = new MemoryConfigCacheAdapter<{
      value: number;
    }>();

    const result: IConfigResult<{ value: number }> = {
      config: { value: 1 },
      filepath: '/safe/project/config.json',
    };

    cacheAdapter.setFindResult('find-key', result);
    cacheAdapter.setReadResult('read-key', result);
    cacheAdapter.clearFindCache();

    expect(cacheAdapter.getFindResult('find-key')).toBeUndefined();
    expect(cacheAdapter.getReadResult('read-key')).toEqual(result);
  });

  it('clears read cache only', () => {
    const cacheAdapter: MemoryConfigCacheAdapter<{ value: number }> = new MemoryConfigCacheAdapter<{
      value: number;
    }>();

    const findResult: IConfigResult<{ value: number }> = {
      config: { value: 1 },
      filepath: '/safe/project/.apprc.json',
    };

    cacheAdapter.setFindResult('find-key', findResult);
    cacheAdapter.setReadResult('read-key', findResult);
    cacheAdapter.clearReadCache();

    expect(cacheAdapter.getFindResult('find-key')).toEqual(findResult);
    expect(cacheAdapter.getReadResult('read-key')).toBeUndefined();
  });

  it('clears all caches at once', () => {
    const cacheAdapter: MemoryConfigCacheAdapter<{ value: number }> = new MemoryConfigCacheAdapter<{
      value: number;
    }>();

    const result: IConfigResult<{ value: number }> = {
      config: { value: 1 },
      filepath: '/safe/project/config.json',
    };

    cacheAdapter.setFindResult('find-key', result);
    cacheAdapter.setReadResult('read-key', result);
    cacheAdapter.clearAll();

    expect(cacheAdapter.getFindResult('find-key')).toBeUndefined();
    expect(cacheAdapter.getReadResult('read-key')).toBeUndefined();
  });
});
