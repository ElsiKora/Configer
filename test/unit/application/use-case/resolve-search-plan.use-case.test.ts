import type { IResolveSearchPlanInputDto } from '@application/dto/resolve-search-plan.input.dto';
import type { IResolveSearchPlanOutputDto } from '@application/dto/resolve-search-plan.output.dto';

import { ResolveSearchPlanUseCase } from '@application/use-case/resolve-search-plan.use-case';
import { DefaultSearchPlacesResolverAdapter } from '@infrastructure/resolver/create-default-search-places.adapter';
import { PackagePropertyPathNormalizerAdapter } from '@infrastructure/resolver/normalize-package-property-path.adapter';
import { SearchCandidatesResolverAdapter } from '@infrastructure/resolver/resolve-search-candidates.adapter';
import { SearchDirectoriesResolverAdapter } from '@infrastructure/resolver/resolve-search-directories.adapter';
import { SearchPlacesResolverAdapter } from '@infrastructure/resolver/resolve-search-places.adapter';
import { SearchStartDirectoryResolverAdapter } from '@infrastructure/resolver/resolve-search-start-directory.adapter';
import { SearchStrategyResolverAdapter } from '@infrastructure/resolver/resolve-search-strategy.adapter';
import { describe, expect, it } from 'vitest';

const createUseCase = (): ResolveSearchPlanUseCase => {
  return new ResolveSearchPlanUseCase(
    new PackagePropertyPathNormalizerAdapter(),
    new SearchCandidatesResolverAdapter(),
    new SearchDirectoriesResolverAdapter(),
    new SearchPlacesResolverAdapter(new DefaultSearchPlacesResolverAdapter()),
    new SearchStartDirectoryResolverAdapter(),
    new SearchStrategyResolverAdapter(),
  );
};

describe('ResolveSearchPlanUseCase', () => {
  it('produces candidate filepaths for none strategy', () => {
    const useCase: ResolveSearchPlanUseCase = createUseCase();

    const input: IResolveSearchPlanInputDto = {
      cwd: '/safe/project',
      moduleName: 'app',
      packageProperty: undefined,
      searchFrom: undefined,
      searchPlaces: undefined,
      searchStrategy: 'none',
      shouldMergeSearchPlaces: undefined,
      stopDirectory: undefined,
    };
    const output: IResolveSearchPlanOutputDto = useCase.execute(input);

    expect(output.resolvedSearchStrategy).toBe('none');
    expect(output.directoryCandidates).toHaveLength(1);
    expect(output.candidateFilepaths.length).toBeGreaterThan(0);
    expect(output.packagePropertyPath).toEqual(['app']);
  });

  it('includes default search places for module name', () => {
    const useCase: ResolveSearchPlanUseCase = createUseCase();

    const input: IResolveSearchPlanInputDto = {
      cwd: '/safe/project',
      moduleName: 'myapp',
      packageProperty: undefined,
      searchFrom: undefined,
      searchPlaces: undefined,
      searchStrategy: 'none',
      shouldMergeSearchPlaces: undefined,
      stopDirectory: undefined,
    };
    const output: IResolveSearchPlanOutputDto = useCase.execute(input);

    expect(output.resolvedSearchPlaces).toContain('package.json');
    expect(output.resolvedSearchPlaces).toContain('.myapprc.json');
    expect(output.resolvedSearchPlaces).toContain('myapp.config.js');
  });

  it('uses custom search places when merge is disabled', () => {
    const useCase: ResolveSearchPlanUseCase = createUseCase();

    const input: IResolveSearchPlanInputDto = {
      cwd: '/safe/project',
      moduleName: 'myapp',
      packageProperty: undefined,
      searchFrom: undefined,
      searchPlaces: ['custom.config.json'],
      searchStrategy: 'none',
      shouldMergeSearchPlaces: false,
      stopDirectory: undefined,
    };
    const output: IResolveSearchPlanOutputDto = useCase.execute(input);

    expect(output.resolvedSearchPlaces).toEqual(['custom.config.json']);
  });

  it('normalizes package property from dot path', () => {
    const useCase: ResolveSearchPlanUseCase = createUseCase();

    const input: IResolveSearchPlanInputDto = {
      cwd: '/safe/project',
      moduleName: 'myapp',
      packageProperty: 'config.myapp.settings',
      searchFrom: undefined,
      searchPlaces: undefined,
      searchStrategy: 'none',
      shouldMergeSearchPlaces: undefined,
      stopDirectory: undefined,
    };
    const output: IResolveSearchPlanOutputDto = useCase.execute(input);

    expect(output.packagePropertyPath).toEqual(['config', 'myapp', 'settings']);
  });

  it('resolves search start directory from searchFrom', () => {
    const useCase: ResolveSearchPlanUseCase = createUseCase();

    const input: IResolveSearchPlanInputDto = {
      cwd: '/safe/project',
      moduleName: 'myapp',
      packageProperty: undefined,
      searchFrom: '/safe/project/sub/dir',
      searchPlaces: undefined,
      searchStrategy: 'none',
      shouldMergeSearchPlaces: undefined,
      stopDirectory: undefined,
    };
    const output: IResolveSearchPlanOutputDto = useCase.execute(input);

    expect(output.searchStartDirectory).toBe('/safe/project/sub/dir');
  });
});
