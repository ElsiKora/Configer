import type { TAsyncLoader } from '@domain/type/async-loader.type';
import type { TSyncLoader } from '@domain/type/sync-loader.type';

import { ConfigError } from '@domain/error';

export class JsonLoaderAdapter {
  public readonly loadAsync: TAsyncLoader = (filepath: string, content: string): unknown => {
    return this.parseJsonContent(content, filepath);
  };

  public readonly loadSync: TSyncLoader = (filepath: string, content: string): unknown => {
    return this.parseJsonContent(content, filepath);
  };

  private readonly parseJsonContent = (content: string, filepath: string): unknown => {
    const normalizedContent: string = content.trim();

    if (normalizedContent.length === 0) {
      return undefined;
    }

    try {
      return JSON.parse(normalizedContent) as unknown;
    } catch (error) {
      throw new ConfigError(
        `Failed to parse JSON config at "${filepath}".`,
        'CONFIG_JSON_PARSE_ERROR',
        error as Error,
      );
    }
  };
}
