import type { IConfigParserInterface } from '@application/interface/config-parser.interface';

import { parse } from 'dotenv';

export class EnvironmentParserAdapter implements IConfigParserInterface {
  public readonly parse = (content: string): unknown => {
    return parse(content);
  };
}
