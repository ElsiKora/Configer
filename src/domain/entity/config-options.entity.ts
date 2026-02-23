import type { ILoaderRegistryEntry } from '@domain/entity/loader-registry-entry.entity';
import type { IConfigPlugin } from '@domain/entity/plugin.entity';
import type { ISchemaDescriptor } from '@domain/entity/schema.entity';
import type { TConfigTransform } from '@domain/type/config-transform.type';
import type { TSearchStrategy } from '@domain/type/search-strategy.type';

/**
 * Runtime options for Configer client creation.
 * @see https://elsikora.dev/configer/docs/api-reference
 */
export interface IConfigOptions<TEntity = unknown> {
  context?: Record<string, unknown>;
  cwd?: string;
  envName?: false | string;
  loaders?: Record<string, ILoaderRegistryEntry>;
  moduleName: string;
  packageProperty?: Array<string> | string;
  plugins?: Array<IConfigPlugin<TEntity>>;
  schema?: ISchemaDescriptor<TEntity>;
  searchPlaces?: Array<string>;
  searchStrategy?: TSearchStrategy;
  shouldIgnoreEmptySearchPlaces?: boolean;
  shouldMergeSearchPlaces?: boolean;
  stopDirectory?: string;
  transform?: TConfigTransform<TEntity>;
  withCache?: boolean;
}
