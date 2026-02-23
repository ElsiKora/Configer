/**
 * Loader execution context passed to loader functions.
 * @see https://elsikora.dev/configer/docs/api-reference
 */
export interface ILoaderContext {
  moduleName: string;
  packagePropertyPath: Array<string>;
}
