import path from 'node:path';

import { SearchCandidatesResolverAdapter } from '@infrastructure/resolver/resolve-search-candidates.adapter';
import { describe, expect, it } from 'vitest';

describe('SearchCandidatesResolverAdapter', () => {
  it('resolves relative and absolute candidates and removes duplicates', () => {
    const adapter: SearchCandidatesResolverAdapter = new SearchCandidatesResolverAdapter();
    const directories: Array<string> = ['/safe/project', '/safe/project'];

    const searchPlaces: Array<string> = [
      '/safe/global/config.json',
      'config/app.json',
      'config/app.json',
    ];
    const result: Array<string> = adapter.execute(directories, searchPlaces);

    expect(result).toEqual([
      path.normalize('/safe/global/config.json'),
      path.normalize('/safe/project/config/app.json'),
    ]);
  });

  it('returns empty result for empty input sets', () => {
    const adapter: SearchCandidatesResolverAdapter = new SearchCandidatesResolverAdapter();

    expect(adapter.execute([], ['config.json'])).toEqual([]);
    expect(adapter.execute(['/safe/project'], [])).toEqual([]);
  });
});
