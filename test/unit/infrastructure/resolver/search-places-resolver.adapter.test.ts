import { DefaultSearchPlacesResolverAdapter } from '@infrastructure/resolver/create-default-search-places.adapter';
import { SearchPlacesResolverAdapter } from '@infrastructure/resolver/resolve-search-places.adapter';
import { describe, expect, it } from 'vitest';

describe('SearchPlacesResolverAdapter', () => {
  it('returns default places when search places are missing or empty', () => {
    const defaultResolver: DefaultSearchPlacesResolverAdapter =
      new DefaultSearchPlacesResolverAdapter();
    const resolver: SearchPlacesResolverAdapter = new SearchPlacesResolverAdapter(defaultResolver);
    const defaults: Array<string> = defaultResolver.execute('app');

    expect(resolver.execute('app', undefined, true)).toEqual(defaults);
    expect(resolver.execute('app', [], true)).toEqual(defaults);
  });

  it('returns unique custom places when merge is disabled', () => {
    const resolver: SearchPlacesResolverAdapter = new SearchPlacesResolverAdapter(
      new DefaultSearchPlacesResolverAdapter(),
    );

    const result: Array<string> = resolver.execute(
      'app',
      ['custom.json', 'custom.json', 'custom.yaml'],
      false,
    );

    expect(result).toEqual(['custom.json', 'custom.yaml']);
  });

  it('merges custom places with defaults and deduplicates values', () => {
    const resolver: SearchPlacesResolverAdapter = new SearchPlacesResolverAdapter(
      new DefaultSearchPlacesResolverAdapter(),
    );
    const result: Array<string> = resolver.execute('app', ['package.json', 'custom.json'], true);

    expect(result).toContain('package.json');
    expect(result).toContain('custom.json');
    expect(result.filter((value: string): boolean => value === 'package.json')).toHaveLength(1);
  });
});
