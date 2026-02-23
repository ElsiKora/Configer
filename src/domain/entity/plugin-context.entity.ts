/**
 * Context object passed to plugin hooks.
 * @see https://elsikora.dev/configer/docs/api-reference
 */
export interface IPluginContext {
  filepath?: string;
  isSync: boolean;
  moduleName: string;
  searchFrom?: string;
}
