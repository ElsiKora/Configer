import type { IConfigParserInterface } from '@application/interface/config-parser.interface';

import { createRequire } from 'node:module';

const REQUIRE_FUNCTION: ReturnType<typeof createRequire> = createRequire(import.meta.url);

const JSON5_PACKAGE: { parse: (content: string) => unknown } = REQUIRE_FUNCTION('json5') as {
  parse: (content: string) => unknown;
};

export class Json5ParserAdapter implements IConfigParserInterface {
  public readonly parse = (content: string): unknown => {
    return JSON5_PACKAGE.parse(content);
  };
}
