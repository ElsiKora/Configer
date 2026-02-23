import type { IConfigParserInterface } from '@application/interface/config-parser.interface';

import { parse } from 'smol-toml';

export class TomlParserAdapter implements IConfigParserInterface {
  public readonly parse = (content: string): unknown => {
    return parse(content);
  };
}
