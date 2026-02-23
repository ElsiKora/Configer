import type { ISchemaValidationIssue } from '@domain/entity/schema-validation-issue.entity';

/**
 * Result object returned by schema validation.
 * @see https://elsikora.dev/configer/docs/api-reference
 */
export interface ISchemaValidationResult<TEntity> {
  issues: Array<ISchemaValidationIssue>;
  isValid: boolean;
  value: TEntity;
}
