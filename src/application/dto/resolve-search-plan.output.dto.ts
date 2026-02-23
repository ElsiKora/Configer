import type { TSearchStrategy } from '@domain/type/search-strategy.type';

export interface IResolveSearchPlanOutputDto {
  candidateFilepaths: Array<string>;
  directoryCandidates: Array<string>;
  packagePropertyPath: Array<string>;
  resolvedSearchPlaces: Array<string>;
  resolvedSearchStrategy: TSearchStrategy;
  searchStartDirectory: string;
}
