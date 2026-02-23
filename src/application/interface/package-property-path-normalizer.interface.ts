export interface IPackagePropertyPathNormalizerInterface {
  execute: (
    packageProperty: Array<string> | string | undefined,
    moduleName: string,
  ) => Array<string>;
}
