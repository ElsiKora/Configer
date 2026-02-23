import type { ISchemaField } from '@domain/entity/schema-field.entity';

/**
 * Object schema descriptor for configuration validation.
 * @see https://elsikora.dev/configer/docs/api-reference
 */
export interface ISchemaDescriptor<TEntity = unknown> {
  properties: Record<string, ISchemaField>;
  shouldAllowUnknownProperties?: boolean;
  type: 'object';
}
