import type { ISchemaField } from '@domain/entity/schema-field.entity';
import type { ISchemaValidationIssue } from '@domain/entity/schema-validation-issue.entity';
import type { ISchemaValidationResult } from '@domain/entity/schema-validation-result.entity';
import type { ISchemaDescriptor } from '@domain/entity/schema.entity';

export class SchemaValidatorAdapter {
  public readonly validate = <TEntity>(
    inputValue: unknown,
    schema: ISchemaDescriptor<TEntity>,
  ): ISchemaValidationResult<TEntity> => {
    const issues: Array<ISchemaValidationIssue> = [];

    const normalizedObject: Record<string, unknown> = this.normalizeObjectValue(
      inputValue,
      'root',
      issues,
    );

    const validatedValue: unknown = this.validateObject(
      normalizedObject,
      schema.properties,
      schema.shouldAllowUnknownProperties ?? false,
      'root',
      issues,
    );

    return {
      issues,
      isValid: issues.length === 0,
      value: validatedValue as TEntity,
    };
  };

  private readonly cloneValue = (inputValue: unknown): unknown => {
    if (Array.isArray(inputValue)) {
      return inputValue.map((item: unknown) => this.cloneValue(item));
    }

    if (this.isPlainObject(inputValue)) {
      const outputRecord: Record<string, unknown> = {};

      for (const [key, value] of Object.entries(inputValue)) {
        outputRecord[key] = this.cloneValue(value);
      }

      return outputRecord;
    }

    return inputValue;
  };

  private readonly isPlainObject = (inputValue: unknown): inputValue is Record<string, unknown> => {
    return (
      inputValue !== null &&
      typeof inputValue === 'object' &&
      !Array.isArray(inputValue) &&
      Object.getPrototypeOf(inputValue) === Object.prototype
    );
  };

  private readonly matchesPrimitiveType = (
    inputValue: unknown,
    primitiveType: ISchemaField['type'],
  ): boolean => {
    if (primitiveType === 'boolean') {
      return typeof inputValue === 'boolean';
    }

    if (primitiveType === 'null') {
      return inputValue === null;
    }

    if (primitiveType === 'number') {
      return typeof inputValue === 'number' && Number.isFinite(inputValue);
    }

    if (primitiveType === 'string') {
      return typeof inputValue === 'string';
    }

    return false;
  };

  private readonly normalizeObjectValue = (
    inputValue: unknown,
    path: string,
    issues: Array<ISchemaValidationIssue>,
  ): Record<string, unknown> => {
    if (!this.isPlainObject(inputValue)) {
      issues.push({
        code: 'SCHEMA_TYPE_MISMATCH',
        message: `Expected object at "${path}".`,
        path,
      });

      return {};
    }

    return this.cloneValue(inputValue) as Record<string, unknown>;
  };

  private readonly validateArray = (
    inputValue: Array<unknown>,
    field: ISchemaField,
    path: string,
    issues: Array<ISchemaValidationIssue>,
  ): Array<unknown> => {
    if (!field.items) {
      return inputValue;
    }

    const arrayItemField: ISchemaField = field.items;

    return inputValue.map((item: unknown, index: number) => {
      const itemPath: string = `${path}[${index}]`;

      return this.validateField(item, arrayItemField, itemPath, issues);
    });
  };

  private readonly validateField = (
    inputValue: unknown,
    field: ISchemaField,
    path: string,
    issues: Array<ISchemaValidationIssue>,
  ): unknown => {
    const resolvedValue: unknown =
      inputValue === undefined ? this.cloneValue(field.defaultValue) : inputValue;

    if (resolvedValue === undefined) {
      if (field.isRequired) {
        issues.push({
          code: 'SCHEMA_REQUIRED_FIELD',
          message: `Required field is missing at "${path}".`,
          path,
        });
      }

      return undefined;
    }

    if (field.type === 'unknown') {
      return resolvedValue;
    }

    if (field.type === 'array') {
      if (!Array.isArray(resolvedValue)) {
        issues.push({
          code: 'SCHEMA_TYPE_MISMATCH',
          message: `Expected array at "${path}".`,
          path,
        });

        return resolvedValue;
      }

      const validatedArray: Array<unknown> = this.validateArray(resolvedValue, field, path, issues);

      return this.validateWithCustomValidator(validatedArray, field, path, issues);
    }

    if (field.type === 'object') {
      if (!this.isPlainObject(resolvedValue)) {
        issues.push({
          code: 'SCHEMA_TYPE_MISMATCH',
          message: `Expected object at "${path}".`,
          path,
        });

        return resolvedValue;
      }

      const validatedObject: unknown = this.validateObject(
        resolvedValue,
        field.properties ?? {},
        true,
        path,
        issues,
      );

      return this.validateWithCustomValidator(validatedObject, field, path, issues);
    }

    if (!this.matchesPrimitiveType(resolvedValue, field.type)) {
      issues.push({
        code: 'SCHEMA_TYPE_MISMATCH',
        message: `Expected "${field.type}" at "${path}".`,
        path,
      });

      return resolvedValue;
    }

    return this.validateWithCustomValidator(resolvedValue, field, path, issues);
  };

  private readonly validateObject = (
    inputObject: Record<string, unknown>,
    fields: Record<string, ISchemaField>,
    shouldAllowUnknownProperties: boolean,
    path: string,
    issues: Array<ISchemaValidationIssue>,
  ): Record<string, unknown> => {
    const outputObject: Record<string, unknown> = {};

    for (const [fieldKey, field] of Object.entries(fields)) {
      const fieldPath: string = `${path}.${fieldKey}`;
      const fieldValue: unknown = inputObject[fieldKey];
      const validatedFieldValue: unknown = this.validateField(fieldValue, field, fieldPath, issues);

      if (validatedFieldValue !== undefined) {
        outputObject[fieldKey] = validatedFieldValue;
      }
    }

    for (const [fieldKey, fieldValue] of Object.entries(inputObject)) {
      if (fields[fieldKey]) {
        continue;
      }

      if (!shouldAllowUnknownProperties) {
        issues.push({
          code: 'SCHEMA_UNKNOWN_PROPERTY',
          message: `Unknown property "${fieldKey}" at "${path}".`,
          path: `${path}.${fieldKey}`,
        });

        continue;
      }

      outputObject[fieldKey] = fieldValue;
    }

    return outputObject;
  };

  private readonly validateWithCustomValidator = (
    inputValue: unknown,
    field: ISchemaField,
    path: string,
    issues: Array<ISchemaValidationIssue>,
  ): unknown => {
    if (!field.validator) {
      return inputValue;
    }

    const validationResult: boolean | string = field.validator(inputValue);

    if (validationResult === true) {
      return inputValue;
    }

    issues.push({
      code: 'SCHEMA_CUSTOM_VALIDATION_FAILED',
      message:
        typeof validationResult === 'string'
          ? validationResult
          : `Custom validator failed at "${path}".`,
      path,
    });

    return inputValue;
  };
}
