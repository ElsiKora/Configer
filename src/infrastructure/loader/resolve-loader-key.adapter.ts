import path from 'node:path';

export class LoaderKeyResolverAdapter {
  public readonly execute = (filepath: string): string => {
    const filename: string = path.basename(filepath);

    if (filename === '.env' || filename.startsWith('.env.')) {
      return '.env';
    }

    if (filename === 'package.json') {
      return 'package.json';
    }

    const extension: string = path.extname(filename);

    if (extension === '.env') {
      return '.env';
    }

    if (extension.length === 0) {
      return 'noExt';
    }

    return extension;
  };
}
