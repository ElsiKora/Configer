import type { IConfigParserInterface } from '@application/interface/config-parser.interface';
import type { ParseError, ParseOptions } from 'jsonc-parser';

import { parse, printParseErrorCode } from 'jsonc-parser';

export class JsoncParserAdapter implements IConfigParserInterface {
  public readonly parse = (content: string): unknown => {
    const parseErrors: Array<ParseError> = [];

    const parseOptions: ParseOptions = {
      ['allowEmptyContent' as const]: false,
      ['allowTrailingComma' as const]: true,
      ['disallowComments' as const]: false,
    };

    const parsedValue: unknown = parse(content, parseErrors, parseOptions);

    if (parseErrors.length > 0) {
      const firstParseError: ParseError | undefined = parseErrors[0];

      if (!firstParseError) {
        throw new Error('JSONC parse failed for unknown reason.');
      }

      const parseErrorCode: string = printParseErrorCode(firstParseError.error);

      throw new Error(`JSONC parse error "${parseErrorCode}" at offset ${firstParseError.offset}.`);
    }

    return parsedValue;
  };
}
