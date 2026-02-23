import type { IConfigParserInterface } from '@application/interface/config-parser.interface';
import type { TAsyncLoader } from '@domain/type/async-loader.type';
import type { TSyncLoader } from '@domain/type/sync-loader.type';

import { ConfigError } from '@domain/error';

export class Json5LoaderAdapter {
  private readonly PARSER: IConfigParserInterface;

  public constructor(parser: IConfigParserInterface) {
    this.PARSER = parser;
  }

  public readonly loadAsync: TAsyncLoader = (filepath: string, content: string): unknown => {
    return this.parseJson5Content(content, filepath);
  };

  public readonly loadSync: TSyncLoader = (filepath: string, content: string): unknown => {
    return this.parseJson5Content(content, filepath);
  };

  private readonly parseJson5Content = (content: string, filepath: string): unknown => {
    const normalizedContent: string = content.trim();

    if (normalizedContent.length === 0) {
      return undefined;
    }

    try {
      return this.PARSER.parse(normalizedContent);
    } catch (error) {
      throw new ConfigError(
        `Failed to parse JSON5 config at "${filepath}".`,
        'CONFIG_JSON5_PARSE_ERROR',
        error as Error,
      );
    }
  };
}
