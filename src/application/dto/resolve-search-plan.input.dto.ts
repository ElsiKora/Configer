import type { TSearchStrategy } from '@domain/type/search-strategy.type';

export interface IResolveSearchPlanInputDto {
  cwd: string;
  moduleName: string;
  packageProperty: Array<string> | string | undefined;
  searchFrom?: string | undefined;
  searchPlaces?: Array<string> | undefined;
  searchStrategy?: TSearchStrategy | undefined;
  shouldMergeSearchPlaces?: boolean | undefined;
  stopDirectory?: string | undefined;
}
