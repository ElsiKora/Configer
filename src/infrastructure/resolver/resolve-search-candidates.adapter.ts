import type { ISearchCandidatesResolverInterface } from '@application/interface/search-candidates-resolver.interface';

import path from 'node:path';

export class SearchCandidatesResolverAdapter implements ISearchCandidatesResolverInterface {
  public readonly execute = (
    directories: Array<string>,
    searchPlaces: Array<string>,
  ): Array<string> => {
    const candidatePaths: Array<string> = [];

    for (const directory of directories) {
      for (const searchPlace of searchPlaces) {
        const absolutePath: string = path.isAbsolute(searchPlace)
          ? searchPlace
          : path.join(directory, searchPlace);

        candidatePaths.push(path.normalize(absolutePath));
      }
    }

    return this.uniquePaths(candidatePaths);
  };

  private readonly uniquePaths = (paths: Array<string>): Array<string> => {
    const outputPaths: Array<string> = [];
    const knownPaths: Set<string> = new Set<string>();

    for (const filepath of paths) {
      if (!knownPaths.has(filepath)) {
        outputPaths.push(filepath);
        knownPaths.add(filepath);
      }
    }

    return outputPaths;
  };
}
