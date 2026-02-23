import type { ILoaderContext } from '@domain/entity/loader.entity';
import type { TAsyncLoader } from '@domain/type/async-loader.type';
import type { TSyncLoader } from '@domain/type/sync-loader.type';

import { ConfigError } from '@domain/error';

export class PackageJsonLoaderAdapter {
  public readonly loadAsync: TAsyncLoader = (
    filepath: string,
    content: string,
    context: ILoaderContext,
  ): unknown => {
    return this.parseAndExtractPackageProperty(filepath, content, context.packagePropertyPath);
  };

  public readonly loadSync: TSyncLoader = (
    filepath: string,
    content: string,
    context: ILoaderContext,
  ): unknown => {
    return this.parseAndExtractPackageProperty(filepath, content, context.packagePropertyPath);
  };

  private readonly parseAndExtractPackageProperty = (
    filepath: string,
    content: string,
    packagePropertyPath: Array<string>,
  ): unknown => {
    const normalizedContent: string = content.trim();

    if (normalizedContent.length === 0) {
      return undefined;
    }

    try {
      const packageContent: unknown = JSON.parse(normalizedContent) as unknown;

      return this.readPropertyByPath(packageContent, packagePropertyPath);
    } catch (error) {
      throw new ConfigError(
        `Failed to parse package config at "${filepath}".`,
        'CONFIG_PACKAGE_PARSE_ERROR',
        error as Error,
      );
    }
  };

  private readonly readPropertyByPath = (
    inputValue: unknown,
    pathParts: Array<string>,
  ): unknown => {
    let currentValue: unknown = inputValue;

    for (const part of pathParts) {
      if (!currentValue || typeof currentValue !== 'object') {
        return undefined;
      }

      currentValue = (currentValue as Record<string, unknown>)[part];
    }

    return currentValue;
  };
}
