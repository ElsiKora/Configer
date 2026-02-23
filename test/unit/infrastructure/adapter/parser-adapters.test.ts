import { EnvironmentParserAdapter } from '@infrastructure/adapter/environment-parser.adapter';
import { Json5ParserAdapter } from '@infrastructure/adapter/json5-parser.adapter';
import { JsoncParserAdapter } from '@infrastructure/adapter/jsonc-parser.adapter';
import { TomlParserAdapter } from '@infrastructure/adapter/toml-parser.adapter';
import { YamlParserAdapter } from '@infrastructure/adapter/yaml-parser.adapter';
import { describe, expect, it } from 'vitest';

const DECIMAL_RADIX: number = '0123456789'.length;
const PORT_PRIMARY: number = Number.parseInt('8080', DECIMAL_RADIX);
const PORT_SECONDARY: number = Number.parseInt('8081', DECIMAL_RADIX);
const DATABASE_PORT: number = Number.parseInt('5432', DECIMAL_RADIX);
const VALUE_ONE: number = Number.parseInt('1', DECIMAL_RADIX);
const VALUE_TWO: number = Number.parseInt('2', DECIMAL_RADIX);
const VALUE_THREE: number = Number.parseInt('3', DECIMAL_RADIX);
const VALUE_FIVE: number = Number.parseInt('5', DECIMAL_RADIX);
const VALUE_SIX: number = Number.parseInt('6', DECIMAL_RADIX);

describe('Parser adapters', () => {
  it('parses YAML objects, inline collections and arrays', () => {
    const yamlParserAdapter: YamlParserAdapter = new YamlParserAdapter();

    const parsedValue: unknown = yamlParserAdapter.parse(`
service:
  isEnabled: true
  retries: 3
ports:
  - 8080
  - 8081
meta: { host: localhost, port: 5432 }
flags: [true, false]
`);

    expect(parsedValue).toEqual({
      flags: [true, false],
      meta: {
        host: 'localhost',
        port: DATABASE_PORT,
      },
      ports: [PORT_PRIMARY, PORT_SECONDARY],
      service: {
        isEnabled: true,
        retries: VALUE_THREE,
      },
    });
  });

  it('parses TOML sections and array tables', () => {
    const tomlParserAdapter: TomlParserAdapter = new TomlParserAdapter();

    const parsedValue: unknown = tomlParserAdapter.parse(`
name = "configer"
ports = [1, 2]
[database]
host = "localhost"
[[items]]
name = "first"
[[items]]
name = "second"
`);

    expect(parsedValue).toEqual({
      database: {
        host: 'localhost',
      },
      items: [{ name: 'first' }, { name: 'second' }],
      name: 'configer',
      ports: [VALUE_ONE, VALUE_TWO],
    });
  });

  it('parses JSON5 relaxed syntax and special numbers', () => {
    const parserAdapter: Json5ParserAdapter = new Json5ParserAdapter();

    const json5ParsedValue: unknown = parserAdapter.parse(`
{
  isUnquoted: true,
  list: [1, 2,],
  max: Infinity,
  value: NaN,
  text: 'ok',
}
`);

    expect(json5ParsedValue).toEqual({
      isUnquoted: true,
      list: [VALUE_ONE, VALUE_TWO],
      max: Infinity,
      text: 'ok',
      value: Number.NaN,
    });
    expect((): unknown => parserAdapter.parse('{ invalid: undefined }')).toThrow(Error);
  });

  it('parses JSONC comments and throws on invalid payloads', () => {
    const parserAdapter: JsoncParserAdapter = new JsoncParserAdapter();

    const parsedJsoncValue: unknown = parserAdapter.parse(`
/* block comment */
{
  "port": 5,
  "depth": 3, // trailing comment
}
`);

    expect(parsedJsoncValue).toEqual({
      depth: VALUE_THREE,
      port: VALUE_FIVE,
    });
    expect((): unknown => parserAdapter.parse('{ "port": }')).toThrow(Error);
  });

  it('parses TOML inline tables and throws for invalid key-value lines', () => {
    const tomlParserAdapter: TomlParserAdapter = new TomlParserAdapter();

    const parsedValue: unknown = tomlParserAdapter.parse(`
title = "demo"
[database]
connection = { host = "localhost", port = 5432 }
pool = [1, 2, 3]
`);

    expect(parsedValue).toEqual({
      database: {
        connection: {
          host: 'localhost',
          port: Number.parseInt('5432', DECIMAL_RADIX),
        },
        pool: [VALUE_ONE, VALUE_TWO, VALUE_THREE],
      },
      title: 'demo',
    });
    expect((): unknown => tomlParserAdapter.parse('invalidLine')).toThrow(Error);
  });

  it('parses YAML scalars and throws on invalid YAML payload', () => {
    const yamlParserAdapter: YamlParserAdapter = new YamlParserAdapter();

    const parsedValue: unknown = yamlParserAdapter.parse(`
title: "demo"
fallback: null
size: 6
`);

    expect(parsedValue).toEqual({
      fallback: null,
      size: VALUE_SIX,
      title: 'demo',
    });
    expect((): unknown => yamlParserAdapter.parse('root:\n  child: [1, 2')).toThrow(Error);
  });

  it('parses environment variable pairs', () => {
    const environmentParserAdapter: EnvironmentParserAdapter = new EnvironmentParserAdapter();

    const parsedValue: Record<string, string> = environmentParserAdapter.parse(`
FOO=bar
export BAR="baz"
QUX='value'
`) as Record<string, string>;

    expect(parsedValue).toEqual({
      BAR: 'baz',
      FOO: 'bar',
      QUX: 'value',
    });
  });
});
