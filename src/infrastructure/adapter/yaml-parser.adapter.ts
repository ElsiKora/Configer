import type { IConfigParserInterface } from '@application/interface/config-parser.interface';

import { parse } from 'yaml';

export class YamlParserAdapter implements IConfigParserInterface {
  public readonly parse = (content: string): unknown => {
    return parse(content);
  };
}
