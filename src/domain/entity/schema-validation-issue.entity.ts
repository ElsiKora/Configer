/**
 * Individual schema validation issue.
 * @see https://elsikora.dev/configer/docs/api-reference
 */
export interface ISchemaValidationIssue {
  code: string;
  message: string;
  path: string;
}
