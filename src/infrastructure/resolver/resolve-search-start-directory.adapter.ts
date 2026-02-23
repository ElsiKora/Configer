import type { Stats } from 'node:fs';

import type { ISearchStartDirectoryResolverInterface } from '@application/interface/search-start-directory-resolver.interface';

import { existsSync, statSync } from 'node:fs';
import path from 'node:path';

export class SearchStartDirectoryResolverAdapter implements ISearchStartDirectoryResolverInterface {
  public readonly execute = (cwd: string, searchFrom: string | undefined): string => {
    const basePath: string = searchFrom ?? cwd;
    const absolutePath: string = path.resolve(cwd, basePath);

    if (existsSync(absolutePath)) {
      const stats: Stats = statSync(absolutePath);

      if (stats.isDirectory()) {
        return absolutePath;
      }

      return path.dirname(absolutePath);
    }

    if (this.hasFileExtension(absolutePath)) {
      return path.dirname(absolutePath);
    }

    return absolutePath;
  };

  private readonly hasFileExtension = (filepath: string): boolean => {
    return path.extname(filepath).length > 0;
  };
}
