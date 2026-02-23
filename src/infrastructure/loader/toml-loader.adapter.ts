import type { IConfigParserInterface } from '@application/interface/config-parser.interface';
import type { TAsyncLoader } from '@domain/type/async-loader.type';
import type { TSyncLoader } from '@domain/type/sync-loader.type';

import { ConfigError } from '@domain/error';

export class TomlLoaderAdapter {
  private readonly PARSER: IConfigParserInterface;

  public constructor(parser: IConfigParserInterface) {
    this.PARSER = parser;
  }

  public readonly loadAsync: TAsyncLoader = (filepath: string, content: string): unknown => {
    return this.parseTomlContent(content, filepath);
  };

  public readonly loadSync: TSyncLoader = (filepath: string, content: string): unknown => {
    return this.parseTomlContent(content, filepath);
  };

  private readonly parseTomlContent = (content: string, filepath: string): unknown => {
    const normalizedContent: string = content.trim();

    if (normalizedContent.length === 0) {
      return undefined;
    }

    try {
      return this.PARSER.parse(normalizedContent);
    } catch (error) {
      throw new ConfigError(
        `Failed to parse TOML config at "${filepath}".`,
        'CONFIG_TOML_PARSE_ERROR',
        error as Error,
      );
    }
  };
}
