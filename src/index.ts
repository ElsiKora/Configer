/**
 * Public Configer API surface.
 * @see https://elsikora.dev/configer/docs/api-reference
 */
export type {
  IConfigClient,
  IConfigClientSync,
  IConfigFunctionContext,
  IConfigOptions,
  IConfigPlugin,
  IConfigResult,
  ILoaderContext,
  ILoaderRegistryEntry,
  IPluginContext,
  ISchemaDescriptor,
  ISchemaField,
  ISchemaValidationIssue,
  ISchemaValidationResult,
  IWatchHandle,
  TAsyncLoader,
  TConfigFactory,
  TConfigTransform,
  TLoaderRegistry,
  TSchemaPrimitiveType,
  TSearchStrategy,
  TSyncLoader,
  TWatchConfigCallback,
} from '@domain/index';
export { createConfiger, createConfigerSync } from '@presentation/function';
