import type { TAsyncLoader } from '@domain/type/async-loader.type';
import type { TSyncLoader } from '@domain/type/sync-loader.type';

import { createRequire } from 'node:module';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

import { ConfigError } from '@domain/error';

export class JsLoaderAdapter {
  public readonly loadAsync: TAsyncLoader = async (filepath: string): Promise<unknown> => {
    try {
      const moduleUrl: URL = pathToFileURL(filepath);
      moduleUrl.searchParams.set('t', String(Date.now()));
      const loadedModule: unknown = (await import(moduleUrl.href)) as unknown;

      return this.resolveModuleValue(loadedModule);
    } catch (error) {
      throw new ConfigError(
        `Failed to import JS/TS config at "${filepath}".`,
        'CONFIG_JS_IMPORT_ERROR',
        error as Error,
      );
    }
  };

  public readonly loadSync: TSyncLoader = (filepath: string): unknown => {
    const extension: string = path.extname(filepath);
    const unsupportedSyncExtensions: Set<string> = new Set<string>(['.mjs', '.mts', '.ts']);

    if (unsupportedSyncExtensions.has(extension)) {
      throw new ConfigError(
        `Synchronous loader does not support "${extension}" config files. Use async API.`,
        'CONFIG_SYNC_UNSUPPORTED_EXTENSION',
      );
    }

    try {
      const requireFunction: (id: string) => unknown = createRequire(import.meta.url);
      const loadedModule: unknown = requireFunction(filepath);

      return this.resolveModuleValue(loadedModule);
    } catch (error) {
      throw new ConfigError(
        `Failed to require JS config at "${filepath}".`,
        'CONFIG_JS_REQUIRE_ERROR',
        error as Error,
      );
    }
  };

  private readonly resolveModuleValue = (moduleValue: unknown): unknown => {
    if (moduleValue && typeof moduleValue === 'object' && 'default' in moduleValue) {
      return (moduleValue as { default: unknown }).default;
    }

    return moduleValue;
  };
}
