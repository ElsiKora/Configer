import type { TSchemaPrimitiveType } from '@domain/type/schema-primitive.type';

/**
 * Field-level validation contract used in schema properties.
 * @see https://elsikora.dev/configer/docs/api-reference
 */
export interface ISchemaField {
  defaultValue?: unknown;
  isRequired?: boolean;
  items?: ISchemaField;
  properties?: Record<string, ISchemaField>;
  type: TSchemaPrimitiveType;
  validator?: (value: unknown) => boolean | string;
}
