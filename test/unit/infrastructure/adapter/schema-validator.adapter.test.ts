import type { ISchemaValidationIssue } from '@domain/entity/schema-validation-issue.entity';
import type { ISchemaValidationResult } from '@domain/entity/schema-validation-result.entity';
import type { ISchemaDescriptor } from '@domain/entity/schema.entity';

import { SchemaValidatorAdapter } from '@infrastructure/adapter/schema-validator.adapter';
import { describe, expect, it } from 'vitest';

const DECIMAL_RADIX: number = '0123456789'.length;
const VALUE_THREE: number = Number.parseInt('3', DECIMAL_RADIX);

describe('SchemaValidatorAdapter', () => {
  it('validates correct input against schema', () => {
    const schemaValidatorAdapter: SchemaValidatorAdapter = new SchemaValidatorAdapter();

    const schema: ISchemaDescriptor<{ retryCount: number; serviceName: string }> = {
      properties: {
        retryCount: { type: 'number' },
        serviceName: { isRequired: true, type: 'string' },
      },
      shouldAllowUnknownProperties: false,
      type: 'object',
    };

    const result: ISchemaValidationResult<{ retryCount: number; serviceName: string }> =
      schemaValidatorAdapter.validate({ retryCount: VALUE_THREE, serviceName: 'api' }, schema);

    expect(result.isValid).toBe(true);
    expect(result.issues).toHaveLength(0);
    expect(result.value).toEqual({ retryCount: VALUE_THREE, serviceName: 'api' });
  });

  it('reports missing required fields', () => {
    const schemaValidatorAdapter: SchemaValidatorAdapter = new SchemaValidatorAdapter();

    const schema: ISchemaDescriptor<{ serviceName: string }> = {
      properties: {
        serviceName: { isRequired: true, type: 'string' },
      },
      shouldAllowUnknownProperties: false,
      type: 'object',
    };

    const result: ISchemaValidationResult<{ serviceName: string }> =
      schemaValidatorAdapter.validate({}, schema);

    expect(result.isValid).toBe(false);
    expect(result.issues[0]?.code).toBe('SCHEMA_REQUIRED_FIELD');
  });

  it('reports type mismatch', () => {
    const schemaValidatorAdapter: SchemaValidatorAdapter = new SchemaValidatorAdapter();

    const schema: ISchemaDescriptor<{ retryCount: number }> = {
      properties: {
        retryCount: { type: 'number' },
      },
      shouldAllowUnknownProperties: false,
      type: 'object',
    };

    const result: ISchemaValidationResult<{ retryCount: number }> = schemaValidatorAdapter.validate(
      { retryCount: 'not-a-number' },
      schema,
    );

    expect(result.isValid).toBe(false);
    expect(result.issues[0]?.code).toBe('SCHEMA_TYPE_MISMATCH');
  });

  it('reports unknown properties when disallowed', () => {
    const schemaValidatorAdapter: SchemaValidatorAdapter = new SchemaValidatorAdapter();

    const schema: ISchemaDescriptor<Record<string, never>> = {
      properties: {},
      shouldAllowUnknownProperties: false,
      type: 'object',
    };

    const result: ISchemaValidationResult<Record<string, never>> = schemaValidatorAdapter.validate(
      { extraField: 'value' },
      schema,
    );

    expect(result.isValid).toBe(false);
    expect(result.issues[0]?.code).toBe('SCHEMA_UNKNOWN_PROPERTY');
  });

  it('applies default values for missing optional fields', () => {
    const schemaValidatorAdapter: SchemaValidatorAdapter = new SchemaValidatorAdapter();

    const schema: ISchemaDescriptor<{ retryCount: number }> = {
      properties: {
        retryCount: { defaultValue: VALUE_THREE, type: 'number' },
      },
      shouldAllowUnknownProperties: false,
      type: 'object',
    };

    const result: ISchemaValidationResult<{ retryCount: number }> = schemaValidatorAdapter.validate(
      {},
      schema,
    );

    expect(result.isValid).toBe(true);
    expect(result.value).toEqual({ retryCount: VALUE_THREE });
  });

  it('runs custom validator function', () => {
    const schemaValidatorAdapter: SchemaValidatorAdapter = new SchemaValidatorAdapter();

    const schema: ISchemaDescriptor<{ serviceName: string }> = {
      properties: {
        serviceName: {
          type: 'string',
          validator: (value: unknown): string | true => {
            if (typeof value === 'string' && value.length > 0) {
              return true;
            }

            return 'Service name must not be empty.';
          },
        },
      },
      shouldAllowUnknownProperties: false,
      type: 'object',
    };

    const validResult: ISchemaValidationResult<{ serviceName: string }> =
      schemaValidatorAdapter.validate({ serviceName: 'api' }, schema);

    const invalidResult: ISchemaValidationResult<{ serviceName: string }> =
      schemaValidatorAdapter.validate({ serviceName: '' }, schema);

    expect(validResult.isValid).toBe(true);
    expect(invalidResult.isValid).toBe(false);
    expect(invalidResult.issues[0]?.code).toBe('SCHEMA_CUSTOM_VALIDATION_FAILED');
  });

  it('validates nested object and array schemas', () => {
    const schemaValidatorAdapter: SchemaValidatorAdapter = new SchemaValidatorAdapter();

    const schema: ISchemaDescriptor<{ items: Array<number>; nested: { value: number } }> = {
      properties: {
        items: {
          items: { type: 'number' },
          type: 'array',
        },
        nested: {
          properties: {
            value: { isRequired: true, type: 'number' },
          },
          type: 'object',
        },
      },
      shouldAllowUnknownProperties: false,
      type: 'object',
    };

    const validResult: ISchemaValidationResult<{
      items: Array<number>;
      nested: { value: number };
    }> = schemaValidatorAdapter.validate(
      { items: [VALUE_THREE, VALUE_THREE], nested: { value: VALUE_THREE } },
      schema,
    );

    expect(validResult.isValid).toBe(true);

    const invalidResult: ISchemaValidationResult<{
      items: Array<number>;
      nested: { value: number };
    }> = schemaValidatorAdapter.validate({ items: 'not-array', nested: 'not-object' }, schema);

    expect(invalidResult.isValid).toBe(false);
  });

  it('handles non-object root input gracefully', () => {
    const schemaValidatorAdapter: SchemaValidatorAdapter = new SchemaValidatorAdapter();

    const schema: ISchemaDescriptor<Record<string, unknown>> = {
      properties: {},
      shouldAllowUnknownProperties: true,
      type: 'object',
    };

    const result: ISchemaValidationResult<Record<string, unknown>> =
      schemaValidatorAdapter.validate('not-an-object', schema);

    expect(result.isValid).toBe(false);
    expect(result.issues[0]?.code).toBe('SCHEMA_TYPE_MISMATCH');
  });

  it('supports boolean, null, unknown, optional undefined and object/array fallbacks', () => {
    const schemaValidatorAdapter: SchemaValidatorAdapter = new SchemaValidatorAdapter();

    const schema: ISchemaDescriptor<Record<string, unknown>> = {
      properties: {
        isEnabled: { type: 'boolean' },
        maybeText: { type: 'string' },
        metadata: { type: 'object' },
        nullableValue: { type: 'null' },
        rawValue: { type: 'unknown' },
        tags: { type: 'array' },
      },
      type: 'object',
    };

    const result: ISchemaValidationResult<Record<string, unknown>> =
      schemaValidatorAdapter.validate(
        {
          isEnabled: true,
          metadata: { isNested: true },
          nullableValue: null,
          rawValue: { any: 'shape' },
          tags: [VALUE_THREE, 'x'],
        },
        schema,
      );

    expect(result.isValid).toBe(true);
    expect(result.value).toEqual({
      isEnabled: true,
      metadata: { isNested: true },
      nullableValue: null,
      rawValue: { any: 'shape' },
      tags: [VALUE_THREE, 'x'],
    });
  });

  it('reports string mismatch and custom validator false result', () => {
    const schemaValidatorAdapter: SchemaValidatorAdapter = new SchemaValidatorAdapter();

    const schema: ISchemaDescriptor<{ score: number; serviceName: string }> = {
      properties: {
        score: {
          type: 'number',
          validator: (): boolean => {
            return false;
          },
        },
        serviceName: { type: 'string' },
      },
      shouldAllowUnknownProperties: false,
      type: 'object',
    };

    const result: ISchemaValidationResult<{ score: number; serviceName: string }> =
      schemaValidatorAdapter.validate({ score: VALUE_THREE, serviceName: VALUE_THREE }, schema);

    expect(result.isValid).toBe(false);
    expect(
      result.issues.some((issue: ISchemaValidationIssue): boolean => {
        return issue.code === 'SCHEMA_TYPE_MISMATCH';
      }),
    ).toBe(true);
    expect(
      result.issues.some((issue: ISchemaValidationIssue): boolean => {
        return issue.code === 'SCHEMA_CUSTOM_VALIDATION_FAILED';
      }),
    ).toBe(true);
  });
});
