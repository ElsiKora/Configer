import type { IConfigParserInterface } from '@application/interface/config-parser.interface';
import type { TAsyncLoader } from '@domain/type/async-loader.type';
import type { TSyncLoader } from '@domain/type/sync-loader.type';

import { ConfigError } from '@domain/error';

export class YamlLoaderAdapter {
  private readonly PARSER: IConfigParserInterface;

  public constructor(parser: IConfigParserInterface) {
    this.PARSER = parser;
  }

  public readonly loadAsync: TAsyncLoader = (filepath: string, content: string): unknown => {
    return this.parseYamlContent(content, filepath);
  };

  public readonly loadSync: TSyncLoader = (filepath: string, content: string): unknown => {
    return this.parseYamlContent(content, filepath);
  };

  private readonly parseYamlContent = (content: string, filepath: string): unknown => {
    const normalizedContent: string = content.trim();

    if (normalizedContent.length === 0) {
      return undefined;
    }

    try {
      return this.PARSER.parse(normalizedContent);
    } catch (error) {
      throw new ConfigError(
        `Failed to parse YAML config at "${filepath}".`,
        'CONFIG_YAML_PARSE_ERROR',
        error as Error,
      );
    }
  };
}
