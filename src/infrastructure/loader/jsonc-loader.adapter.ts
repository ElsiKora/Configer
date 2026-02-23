import type { IConfigParserInterface } from '@application/interface/config-parser.interface';
import type { TAsyncLoader } from '@domain/type/async-loader.type';
import type { TSyncLoader } from '@domain/type/sync-loader.type';

import { ConfigError } from '@domain/error';

export class JsoncLoaderAdapter {
  private readonly PARSER: IConfigParserInterface;

  public constructor(parser: IConfigParserInterface) {
    this.PARSER = parser;
  }

  public readonly loadAsync: TAsyncLoader = (filepath: string, content: string): unknown => {
    return this.parseJsoncContent(content, filepath);
  };

  public readonly loadSync: TSyncLoader = (filepath: string, content: string): unknown => {
    return this.parseJsoncContent(content, filepath);
  };

  private readonly parseJsoncContent = (content: string, filepath: string): unknown => {
    const normalizedContent: string = content.trim();

    if (normalizedContent.length === 0) {
      return undefined;
    }

    try {
      return this.PARSER.parse(normalizedContent);
    } catch (error) {
      throw new ConfigError(
        `Failed to parse JSONC config at "${filepath}".`,
        'CONFIG_JSONC_PARSE_ERROR',
        error as Error,
      );
    }
  };
}
