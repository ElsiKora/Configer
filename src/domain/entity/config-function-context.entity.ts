/**
 * Context passed to configuration factory functions.
 * @see https://elsikora.dev/configer/docs/api-reference
 */
export interface IConfigFunctionContext {
  cwd: string;
  envName?: string;
  filepath: string;
  moduleName: string;
  userContext: Record<string, unknown>;
}
