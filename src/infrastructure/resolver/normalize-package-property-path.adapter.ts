import type { IPackagePropertyPathNormalizerInterface } from '@application/interface/package-property-path-normalizer.interface';

export class PackagePropertyPathNormalizerAdapter implements IPackagePropertyPathNormalizerInterface {
  public readonly execute = (
    packageProperty: Array<string> | string | undefined,
    moduleName: string,
  ): Array<string> => {
    if (Array.isArray(packageProperty)) {
      const normalizedParts: Array<string> = packageProperty
        .map((part: string) => part.trim())
        .filter((part: string) => part.length > 0);

      if (normalizedParts.length > 0) {
        return normalizedParts;
      }
    }

    if (typeof packageProperty === 'string') {
      const normalizedParts: Array<string> = this.splitPathByDot(packageProperty);

      if (normalizedParts.length > 0) {
        return normalizedParts;
      }
    }

    return [moduleName];
  };

  private readonly splitPathByDot = (pathValue: string): Array<string> => {
    const rawParts: Array<string> = pathValue.split('.');

    const normalizedParts: Array<string> = rawParts
      .map((part: string) => part.trim())
      .filter((part: string) => part.length > 0);

    return normalizedParts;
  };
}
