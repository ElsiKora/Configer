import type { FSWatcher } from 'node:fs';

import type { IResolveSearchPlanOutputDto } from '@application/dto/resolve-search-plan.output.dto';
import type { IConfigCacheInterface } from '@application/interface/config-cache.interface';
import type { ResolveSearchPlanUseCase } from '@application/use-case/resolve-search-plan.use-case';
import type { IConfigClient } from '@domain/entity/config-client.entity';
import type { IConfigFunctionContext } from '@domain/entity/config-function-context.entity';
import type { IConfigOptions } from '@domain/entity/config-options.entity';
import type { IConfigResult } from '@domain/entity/config-result.entity';
import type { ILoaderRegistryEntry } from '@domain/entity/loader-registry-entry.entity';
import type { ILoaderContext } from '@domain/entity/loader.entity';
import type { IPluginContext } from '@domain/entity/plugin-context.entity';
import type { IConfigPlugin } from '@domain/entity/plugin.entity';
import type { ISchemaValidationIssue } from '@domain/entity/schema-validation-issue.entity';
import type { ISchemaValidationResult } from '@domain/entity/schema-validation-result.entity';
import type { IWatchHandle } from '@domain/entity/watch-handle.entity';
import type { TLoaderRegistry } from '@domain/type/loader-registry.type';
import type { TWatchConfigCallback } from '@domain/type/watch-config-callback.type';
import type { DeepMergeAdapter } from '@infrastructure/adapter/deep-merge.adapter';
import type { SchemaValidatorAdapter } from '@infrastructure/adapter/schema-validator.adapter';
import type { LoaderKeyResolverAdapter } from '@infrastructure/loader/resolve-loader-key.adapter';

import { watch } from 'node:fs';
import { existsSync, readFileSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { ConfigError } from '@domain/error';

export class ConfigClientAdapter<TEntity> implements IConfigClient<TEntity> {
  private readonly CACHE: IConfigCacheInterface<TEntity>;

  private readonly CWD: string;

  private readonly DEEP_MERGE_ADAPTER: DeepMergeAdapter;

  private readonly LOADER_KEY_RESOLVER: LoaderKeyResolverAdapter;

  private readonly LOADER_REGISTRY: TLoaderRegistry;

  private readonly OPTIONS: IConfigOptions<TEntity>;

  private readonly PACKAGE_PROPERTY_PATH: Array<string>;

  private readonly RESOLVE_SEARCH_PLAN_USE_CASE: ResolveSearchPlanUseCase;

  private readonly SCHEMA_VALIDATOR_ADAPTER: SchemaValidatorAdapter;

  private readonly SHOULD_USE_CACHE: boolean;

  private readonly WATCH_DEBOUNCE_MS: number;

  public constructor(
    cache: IConfigCacheInterface<TEntity>,
    deepMergeAdapter: DeepMergeAdapter,
    loaderKeyResolver: LoaderKeyResolverAdapter,
    loaderRegistry: TLoaderRegistry,
    options: IConfigOptions<TEntity>,
    packagePropertyPath: Array<string>,
    resolveSearchPlanUseCase: ResolveSearchPlanUseCase,
    schemaValidatorAdapter: SchemaValidatorAdapter,
  ) {
    const decimalRadix: number = '0123456789'.length;

    this.CACHE = cache;
    this.CWD = options.cwd ?? process.cwd();
    this.DEEP_MERGE_ADAPTER = deepMergeAdapter;
    this.LOADER_KEY_RESOLVER = loaderKeyResolver;
    this.LOADER_REGISTRY = loaderRegistry;
    this.OPTIONS = options;
    this.PACKAGE_PROPERTY_PATH = packagePropertyPath;
    this.RESOLVE_SEARCH_PLAN_USE_CASE = resolveSearchPlanUseCase;
    this.SCHEMA_VALIDATOR_ADAPTER = schemaValidatorAdapter;
    this.SHOULD_USE_CACHE = options.withCache ?? true;
    this.WATCH_DEBOUNCE_MS = Number.parseInt('120', decimalRadix);
  }

  public readonly clearCaches = (): void => {
    this.CACHE.clearAll();
  };

  public readonly clearFindCache = (): void => {
    this.CACHE.clearFindCache();
  };

  public readonly clearReadCache = (): void => {
    this.CACHE.clearReadCache();
  };

  public readonly findConfig = async (
    searchFrom?: string,
  ): Promise<IConfigResult<TEntity> | null> => {
    let pluginContext: IPluginContext = this.createPluginContext(false, undefined, searchFrom);

    try {
      pluginContext = await this.resolveBeforeFindPlugins(pluginContext);
      const effectiveSearchFrom: string | undefined = pluginContext.searchFrom;
      const findCacheKey: string = this.createFindCacheKey(effectiveSearchFrom);

      if (this.SHOULD_USE_CACHE) {
        const cachedResult: IConfigResult<TEntity> | null | undefined =
          this.CACHE.getFindResult(findCacheKey);

        if (cachedResult !== undefined) {
          return await this.resolveAfterFindPlugins(cachedResult, pluginContext);
        }
      }

      const searchPlan: IResolveSearchPlanOutputDto = this.RESOLVE_SEARCH_PLAN_USE_CASE.execute({
        cwd: this.CWD,
        moduleName: this.OPTIONS.moduleName,
        packageProperty: this.OPTIONS.packageProperty,
        searchFrom: effectiveSearchFrom,
        searchPlaces: this.OPTIONS.searchPlaces,
        searchStrategy: this.OPTIONS.searchStrategy,
        shouldMergeSearchPlaces: this.OPTIONS.shouldMergeSearchPlaces,
        stopDirectory: this.OPTIONS.stopDirectory,
      });

      for (const candidateFilepath of searchPlan.candidateFilepaths) {
        if (!existsSync(candidateFilepath)) {
          continue;
        }

        const result: IConfigResult<TEntity> = await this.readConfig(candidateFilepath);

        if (this.OPTIONS.shouldIgnoreEmptySearchPlaces && result.config === undefined) {
          continue;
        }

        const afterFindResult: IConfigResult<TEntity> | null = await this.resolveAfterFindPlugins(
          result,
          pluginContext,
        );

        if (this.SHOULD_USE_CACHE) {
          this.CACHE.setFindResult(findCacheKey, afterFindResult);
        }

        return afterFindResult;
      }

      const emptyResult: IConfigResult<TEntity> | null = await this.resolveAfterFindPlugins(
        null,
        pluginContext,
      );

      if (this.SHOULD_USE_CACHE) {
        this.CACHE.setFindResult(findCacheKey, emptyResult);
      }

      return emptyResult;
    } catch (error) {
      await this.resolveOnErrorPlugins(error as Error, pluginContext);

      throw error;
    }
  };

  public readonly findConfigSync = (searchFrom?: string): IConfigResult<TEntity> | null => {
    let pluginContext: IPluginContext = this.createPluginContext(true, undefined, searchFrom);

    try {
      pluginContext = this.resolveBeforeFindPluginsSync(pluginContext);
      const effectiveSearchFrom: string | undefined = pluginContext.searchFrom;
      const findCacheKey: string = this.createFindCacheKey(effectiveSearchFrom);

      if (this.SHOULD_USE_CACHE) {
        const cachedResult: IConfigResult<TEntity> | null | undefined =
          this.CACHE.getFindResult(findCacheKey);

        if (cachedResult !== undefined) {
          return this.resolveAfterFindPluginsSync(cachedResult, pluginContext);
        }
      }

      const searchPlan: IResolveSearchPlanOutputDto = this.RESOLVE_SEARCH_PLAN_USE_CASE.execute({
        cwd: this.CWD,
        moduleName: this.OPTIONS.moduleName,
        packageProperty: this.OPTIONS.packageProperty,
        searchFrom: effectiveSearchFrom,
        searchPlaces: this.OPTIONS.searchPlaces,
        searchStrategy: this.OPTIONS.searchStrategy,
        shouldMergeSearchPlaces: this.OPTIONS.shouldMergeSearchPlaces,
        stopDirectory: this.OPTIONS.stopDirectory,
      });

      for (const candidateFilepath of searchPlan.candidateFilepaths) {
        if (!existsSync(candidateFilepath)) {
          continue;
        }

        const result: IConfigResult<TEntity> = this.readConfigSync(candidateFilepath);

        if (this.OPTIONS.shouldIgnoreEmptySearchPlaces && result.config === undefined) {
          continue;
        }

        const afterFindResult: IConfigResult<TEntity> | null = this.resolveAfterFindPluginsSync(
          result,
          pluginContext,
        );

        if (this.SHOULD_USE_CACHE) {
          this.CACHE.setFindResult(findCacheKey, afterFindResult);
        }

        return afterFindResult;
      }

      const emptyResult: IConfigResult<TEntity> | null = this.resolveAfterFindPluginsSync(
        null,
        pluginContext,
      );

      if (this.SHOULD_USE_CACHE) {
        this.CACHE.setFindResult(findCacheKey, emptyResult);
      }

      return emptyResult;
    } catch (error) {
      this.resolveOnErrorPluginsSync(error as Error, pluginContext);

      throw error;
    }
  };

  public readonly readConfig = async (filepath: string): Promise<IConfigResult<TEntity>> => {
    const normalizedFilepath: string = path.resolve(this.CWD, filepath);
    let pluginContext: IPluginContext = this.createPluginContext(false, normalizedFilepath);

    try {
      pluginContext = await this.resolveBeforeReadPlugins(pluginContext);
      const effectiveFilepath: string = pluginContext.filepath ?? normalizedFilepath;

      const result: IConfigResult<TEntity> = await this.readConfigWithContext(
        effectiveFilepath,
        new Set<string>(),
      );

      return await this.resolveAfterReadPlugins(result, pluginContext);
    } catch (error) {
      await this.resolveOnErrorPlugins(error as Error, pluginContext);

      throw error;
    }
  };

  public readonly readConfigSync = (filepath: string): IConfigResult<TEntity> => {
    const normalizedFilepath: string = path.resolve(this.CWD, filepath);
    let pluginContext: IPluginContext = this.createPluginContext(true, normalizedFilepath);

    try {
      pluginContext = this.resolveBeforeReadPluginsSync(pluginContext);
      const effectiveFilepath: string = pluginContext.filepath ?? normalizedFilepath;

      const result: IConfigResult<TEntity> = this.readConfigSyncWithContext(
        effectiveFilepath,
        new Set<string>(),
      );

      return this.resolveAfterReadPluginsSync(result, pluginContext);
    } catch (error) {
      this.resolveOnErrorPluginsSync(error as Error, pluginContext);

      throw error;
    }
  };

  public readonly watchConfig = (callback: TWatchConfigCallback<TEntity>): IWatchHandle => {
    const searchPlan: IResolveSearchPlanOutputDto = this.RESOLVE_SEARCH_PLAN_USE_CASE.execute({
      cwd: this.CWD,
      moduleName: this.OPTIONS.moduleName,
      packageProperty: this.OPTIONS.packageProperty,
      searchPlaces: this.OPTIONS.searchPlaces,
      searchStrategy: this.OPTIONS.searchStrategy,
      shouldMergeSearchPlaces: this.OPTIONS.shouldMergeSearchPlaces,
      stopDirectory: this.OPTIONS.stopDirectory,
    });
    let debounceTimeout: ReturnType<typeof setTimeout> | undefined;
    let isRefreshRunning: boolean = false;
    const watchers: Array<FSWatcher> = [];
    const watchedDirectories: Set<string> = new Set<string>();

    const triggerRefresh = (): void => {
      if (debounceTimeout) {
        clearTimeout(debounceTimeout);
      }

      debounceTimeout = setTimeout(() => {
        if (isRefreshRunning) {
          return;
        }

        isRefreshRunning = true;
        this.clearCaches();
        void this.findConfig()
          .then(
            (result: IConfigResult<TEntity> | null): void => {
              callback(null, result);
            },
            (error: unknown): void => {
              callback(error as Error, null);
            },
          )
          .finally((): void => {
            isRefreshRunning = false;
          });
      }, this.WATCH_DEBOUNCE_MS);
    };

    for (const directory of searchPlan.directoryCandidates) {
      if (!existsSync(directory) || watchedDirectories.has(directory)) {
        continue;
      }

      watchedDirectories.add(directory);
      const watcher: FSWatcher = watch(directory, triggerRefresh);
      watchers.push(watcher);
    }

    return {
      close: (): void => {
        if (debounceTimeout) {
          clearTimeout(debounceTimeout);
          debounceTimeout = undefined;
        }

        for (const watcher of watchers) {
          watcher.close();
        }
      },
    };
  };

  private readonly createConfigFunctionContext = (filepath: string): IConfigFunctionContext => {
    const userContext: Record<string, unknown> = this.OPTIONS.context ?? {};
    const environmentName: string | undefined = this.resolveEnvironmentName();

    const context: IConfigFunctionContext = {
      cwd: this.CWD,
      filepath,
      moduleName: this.OPTIONS.moduleName,
      userContext,
    };

    if (environmentName) {
      context.envName = environmentName;
    }

    return context;
  };

  private readonly createConfigResult = (
    filepath: string,
    loadedConfiguration: TEntity | undefined,
    sources: Array<string>,
  ): IConfigResult<TEntity> => {
    const uniqueSources: Array<string> = this.uniqueValues(sources);

    if (loadedConfiguration === undefined) {
      const emptyResult: IConfigResult<TEntity> = {
        config: undefined,
        filepath,
        isEmpty: true,
      };

      if (uniqueSources.length > 0) {
        emptyResult.sources = uniqueSources;
      }

      return emptyResult;
    }

    const result: IConfigResult<TEntity> = {
      config: loadedConfiguration,
      filepath,
    };

    if (uniqueSources.length > 0) {
      result.sources = uniqueSources;
    }

    return result;
  };

  private readonly createFindCacheKey = (searchFrom: string | undefined): string => {
    const normalizedSearchFrom: string = searchFrom ? path.resolve(this.CWD, searchFrom) : '<cwd>';

    return `find:${normalizedSearchFrom}`;
  };

  private readonly createLoaderContext = (): ILoaderContext => {
    return {
      moduleName: this.OPTIONS.moduleName,
      packagePropertyPath: this.PACKAGE_PROPERTY_PATH,
    };
  };

  private readonly createPluginContext = (
    isSync: boolean,
    filepath?: string,
    searchFrom?: string,
  ): IPluginContext => {
    const pluginContext: IPluginContext = {
      isSync,
      moduleName: this.OPTIONS.moduleName,
    };

    if (filepath) {
      pluginContext.filepath = filepath;
    }

    if (searchFrom) {
      pluginContext.searchFrom = searchFrom;
    }

    return pluginContext;
  };

  private readonly createReadCacheKey = (filepath: string): string => {
    return `read:${filepath}`;
  };

  private readonly extractInheritanceFilepaths = (
    configValue: unknown,
    sourceFilepath: string,
  ): Array<string> => {
    if (!this.isPlainObject(configValue)) {
      return [];
    }

    const inheritanceKeys: Array<'$import' | 'extends'> = ['$import', 'extends'];
    const outputFilepaths: Array<string> = [];

    for (const inheritanceKey of inheritanceKeys) {
      const rawReferenceValue: unknown = configValue[inheritanceKey];

      if (rawReferenceValue === undefined) {
        continue;
      }

      if (typeof rawReferenceValue === 'string') {
        const normalizedReference: string = rawReferenceValue.trim();

        if (normalizedReference.length > 0) {
          outputFilepaths.push(normalizedReference);
        }

        continue;
      }

      if (Array.isArray(rawReferenceValue)) {
        for (const referenceValue of rawReferenceValue) {
          if (typeof referenceValue !== 'string') {
            throw new ConfigError(
              `Invalid inheritance entry in "${sourceFilepath}". Only string references are supported.`,
              'CONFIG_INVALID_INHERITANCE_ENTRY',
              undefined,
              [
                'Use "$import": "./base.config.json" or "extends": ["./base.config.json"].',
                'Remove non-string entries from inheritance arrays.',
              ],
            );
          }

          const normalizedReference: string = referenceValue.trim();

          if (normalizedReference.length > 0) {
            outputFilepaths.push(normalizedReference);
          }
        }

        continue;
      }

      throw new ConfigError(
        `Invalid inheritance value in "${sourceFilepath}". Use a string or an array of strings.`,
        'CONFIG_INVALID_INHERITANCE_VALUE',
        undefined,
        [
          'Use "$import": "./base.config.json" or "extends": ["./base.config.json"].',
          'Ensure inheritance directives are strings or arrays of strings.',
        ],
      );
    }

    return outputFilepaths;
  };

  private readonly isPlainObject = (inputValue: unknown): inputValue is Record<string, unknown> => {
    return (
      inputValue !== null &&
      typeof inputValue === 'object' &&
      !Array.isArray(inputValue) &&
      Object.getPrototypeOf(inputValue) === Object.prototype
    );
  };

  private readonly isPromiseLike = (inputValue: unknown): inputValue is Promise<unknown> => {
    return (
      !!inputValue &&
      typeof inputValue === 'object' &&
      'then' in inputValue &&
      typeof inputValue.then === 'function'
    );
  };

  private readonly readConfigSyncWithContext = (
    filepath: string,
    resolutionStack: Set<string>,
  ): IConfigResult<TEntity> => {
    const normalizedFilepath: string = path.resolve(this.CWD, filepath);
    const readCacheKey: string = this.createReadCacheKey(normalizedFilepath);

    if (resolutionStack.has(normalizedFilepath)) {
      throw new ConfigError(
        `Circular inheritance detected while resolving "${normalizedFilepath}".`,
        'CONFIG_INHERITANCE_CYCLE',
        undefined,
        [
          'Check "$import" and "extends" chains for self-references.',
          'Break cyclic references by extracting shared config into a separate base file.',
        ],
      );
    }

    if (this.SHOULD_USE_CACHE) {
      const cachedResult: IConfigResult<TEntity> | undefined =
        this.CACHE.getReadResult(readCacheKey);

      if (cachedResult) {
        return cachedResult;
      }
    }

    resolutionStack.add(normalizedFilepath);

    try {
      const fileContent: string = readFileSync(normalizedFilepath, 'utf8');
      const loaderContext: ILoaderContext = this.createLoaderContext();
      const loaderKey: string = this.LOADER_KEY_RESOLVER.execute(normalizedFilepath);
      const loaderEntry: ILoaderRegistryEntry | undefined = this.LOADER_REGISTRY[loaderKey];

      if (!loaderEntry) {
        throw new ConfigError(
          `No loader is registered for "${loaderKey}" while reading "${normalizedFilepath}".`,
          'CONFIG_LOADER_NOT_REGISTERED',
          undefined,
          [
            `Register a loader for "${loaderKey}" in options.loaders.`,
            `Available loader keys: ${Object.keys(this.LOADER_REGISTRY).join(', ')}.`,
          ],
        );
      }

      if (!loaderEntry.syncLoader) {
        throw new ConfigError(
          `Synchronous loader is not available for "${loaderKey}".`,
          'CONFIG_SYNC_LOADER_MISSING',
          undefined,
          [
            'Use the async API via createConfiger(...) for this file type.',
            `Provide a syncLoader for "${loaderKey}" in options.loaders if sync mode is required.`,
          ],
        );
      }

      const loadedConfiguration: unknown = loaderEntry.syncLoader(
        normalizedFilepath,
        fileContent,
        loaderContext,
      );

      const functionResolvedConfiguration: unknown = this.resolveConfigFunctionSync(
        loadedConfiguration,
        normalizedFilepath,
      );

      const inheritanceResolutionResult: {
        resolvedConfiguration: unknown;
        sourceFilepaths: Array<string>;
      } = this.resolveInheritanceSync(
        normalizedFilepath,
        functionResolvedConfiguration,
        resolutionStack,
      );

      const environmentResolvedConfiguration: unknown = this.resolveEnvironmentOverrides(
        inheritanceResolutionResult.resolvedConfiguration,
        normalizedFilepath,
      );

      const schemaResolvedConfiguration: unknown = this.resolveSchemaValidation(
        environmentResolvedConfiguration,
        normalizedFilepath,
      );

      const initialResult: IConfigResult<TEntity> = this.createConfigResult(
        normalizedFilepath,
        schemaResolvedConfiguration as TEntity,
        inheritanceResolutionResult.sourceFilepaths,
      );
      const result: IConfigResult<TEntity> = this.resolveTransformSync(initialResult);

      if (this.SHOULD_USE_CACHE) {
        this.CACHE.setReadResult(readCacheKey, result);
      }

      return result;
    } finally {
      resolutionStack.delete(normalizedFilepath);
    }
  };

  private readonly readConfigWithContext = async (
    filepath: string,
    resolutionStack: Set<string>,
  ): Promise<IConfigResult<TEntity>> => {
    const normalizedFilepath: string = path.resolve(this.CWD, filepath);
    const readCacheKey: string = this.createReadCacheKey(normalizedFilepath);

    if (resolutionStack.has(normalizedFilepath)) {
      throw new ConfigError(
        `Circular inheritance detected while resolving "${normalizedFilepath}".`,
        'CONFIG_INHERITANCE_CYCLE',
        undefined,
        [
          'Check "$import" and "extends" chains for self-references.',
          'Break cyclic references by extracting shared config into a separate base file.',
        ],
      );
    }

    if (this.SHOULD_USE_CACHE) {
      const cachedResult: IConfigResult<TEntity> | undefined =
        this.CACHE.getReadResult(readCacheKey);

      if (cachedResult) {
        return cachedResult;
      }
    }

    resolutionStack.add(normalizedFilepath);

    try {
      const fileContent: string = await readFile(normalizedFilepath, 'utf8');
      const loaderContext: ILoaderContext = this.createLoaderContext();
      const loaderKey: string = this.LOADER_KEY_RESOLVER.execute(normalizedFilepath);
      const loaderEntry: ILoaderRegistryEntry | undefined = this.LOADER_REGISTRY[loaderKey];

      if (!loaderEntry) {
        throw new ConfigError(
          `No loader is registered for "${loaderKey}" while reading "${normalizedFilepath}".`,
          'CONFIG_LOADER_NOT_REGISTERED',
          undefined,
          [
            `Register a loader for "${loaderKey}" in options.loaders.`,
            `Available loader keys: ${Object.keys(this.LOADER_REGISTRY).join(', ')}.`,
          ],
        );
      }

      const loadedConfiguration: unknown = await loaderEntry.asyncLoader(
        normalizedFilepath,
        fileContent,
        loaderContext,
      );

      const functionResolvedConfiguration: unknown = await this.resolveConfigFunction(
        loadedConfiguration,
        normalizedFilepath,
      );

      const inheritanceResolutionResult: {
        resolvedConfiguration: unknown;
        sourceFilepaths: Array<string>;
      } = await this.resolveInheritance(
        normalizedFilepath,
        functionResolvedConfiguration,
        resolutionStack,
      );

      const environmentResolvedConfiguration: unknown = this.resolveEnvironmentOverrides(
        inheritanceResolutionResult.resolvedConfiguration,
        normalizedFilepath,
      );

      const schemaResolvedConfiguration: unknown = this.resolveSchemaValidation(
        environmentResolvedConfiguration,
        normalizedFilepath,
      );

      const initialResult: IConfigResult<TEntity> = this.createConfigResult(
        normalizedFilepath,
        schemaResolvedConfiguration as TEntity,
        inheritanceResolutionResult.sourceFilepaths,
      );
      const result: IConfigResult<TEntity> = await this.resolveTransform(initialResult);

      if (this.SHOULD_USE_CACHE) {
        this.CACHE.setReadResult(readCacheKey, result);
      }

      return result;
    } finally {
      resolutionStack.delete(normalizedFilepath);
    }
  };

  private readonly resolveAfterFindPlugins = async (
    result: IConfigResult<TEntity> | null,
    pluginContext: IPluginContext,
  ): Promise<IConfigResult<TEntity> | null> => {
    let nextResult: IConfigResult<TEntity> | null = result;

    for (const plugin of this.resolvePlugins()) {
      if (!plugin.afterFind) {
        continue;
      }

      nextResult = await plugin.afterFind(nextResult, pluginContext);
    }

    return nextResult;
  };

  private readonly resolveAfterFindPluginsSync = (
    result: IConfigResult<TEntity> | null,
    pluginContext: IPluginContext,
  ): IConfigResult<TEntity> | null => {
    let nextResult: IConfigResult<TEntity> | null = result;

    for (const plugin of this.resolvePlugins()) {
      if (!plugin.afterFind) {
        continue;
      }

      const pluginResult: IConfigResult<TEntity> | null | Promise<IConfigResult<TEntity> | null> =
        plugin.afterFind(nextResult, pluginContext);
      nextResult = this.resolveSyncPluginValue(
        pluginResult,
        'CONFIG_SYNC_PLUGIN_HOOK_PROMISE',
        `Plugin "${plugin.name}" returned Promise from "afterFind" in sync mode.`,
      );
    }

    return nextResult;
  };

  private readonly resolveAfterReadPlugins = async (
    result: IConfigResult<TEntity>,
    pluginContext: IPluginContext,
  ): Promise<IConfigResult<TEntity>> => {
    let nextResult: IConfigResult<TEntity> = result;

    for (const plugin of this.resolvePlugins()) {
      if (!plugin.afterRead) {
        continue;
      }

      nextResult = await plugin.afterRead(nextResult, pluginContext);
    }

    return nextResult;
  };

  private readonly resolveAfterReadPluginsSync = (
    result: IConfigResult<TEntity>,
    pluginContext: IPluginContext,
  ): IConfigResult<TEntity> => {
    let nextResult: IConfigResult<TEntity> = result;

    for (const plugin of this.resolvePlugins()) {
      if (!plugin.afterRead) {
        continue;
      }

      const pluginResult: IConfigResult<TEntity> | Promise<IConfigResult<TEntity>> =
        plugin.afterRead(nextResult, pluginContext);
      nextResult = this.resolveSyncPluginValue(
        pluginResult,
        'CONFIG_SYNC_PLUGIN_HOOK_PROMISE',
        `Plugin "${plugin.name}" returned Promise from "afterRead" in sync mode.`,
      );
    }

    return nextResult;
  };

  private readonly resolveBeforeFindPlugins = async (
    pluginContext: IPluginContext,
  ): Promise<IPluginContext> => {
    let nextContext: IPluginContext = pluginContext;

    for (const plugin of this.resolvePlugins()) {
      if (!plugin.beforeFind) {
        continue;
      }

      nextContext = await plugin.beforeFind(nextContext);
    }

    return nextContext;
  };

  private readonly resolveBeforeFindPluginsSync = (
    pluginContext: IPluginContext,
  ): IPluginContext => {
    let nextContext: IPluginContext = pluginContext;

    for (const plugin of this.resolvePlugins()) {
      if (!plugin.beforeFind) {
        continue;
      }

      const pluginResult: IPluginContext | Promise<IPluginContext> = plugin.beforeFind(nextContext);
      nextContext = this.resolveSyncPluginValue(
        pluginResult,
        'CONFIG_SYNC_PLUGIN_HOOK_PROMISE',
        `Plugin "${plugin.name}" returned Promise from "beforeFind" in sync mode.`,
      );
    }

    return nextContext;
  };

  private readonly resolveBeforeReadPlugins = async (
    pluginContext: IPluginContext,
  ): Promise<IPluginContext> => {
    let nextContext: IPluginContext = pluginContext;

    for (const plugin of this.resolvePlugins()) {
      if (!plugin.beforeRead) {
        continue;
      }

      nextContext = await plugin.beforeRead(nextContext);
    }

    return nextContext;
  };

  private readonly resolveBeforeReadPluginsSync = (
    pluginContext: IPluginContext,
  ): IPluginContext => {
    let nextContext: IPluginContext = pluginContext;

    for (const plugin of this.resolvePlugins()) {
      if (!plugin.beforeRead) {
        continue;
      }

      const pluginResult: IPluginContext | Promise<IPluginContext> = plugin.beforeRead(nextContext);
      nextContext = this.resolveSyncPluginValue(
        pluginResult,
        'CONFIG_SYNC_PLUGIN_HOOK_PROMISE',
        `Plugin "${plugin.name}" returned Promise from "beforeRead" in sync mode.`,
      );
    }

    return nextContext;
  };

  private readonly resolveConfigFunction = async (
    loadedConfiguration: unknown,
    sourceFilepath: string,
  ): Promise<unknown> => {
    if (typeof loadedConfiguration !== 'function') {
      return loadedConfiguration;
    }

    const configFunctionContext: IConfigFunctionContext =
      this.createConfigFunctionContext(sourceFilepath);

    const resolvedValue: unknown = (
      loadedConfiguration as (context: IConfigFunctionContext) => unknown
    )(configFunctionContext);

    if (this.isPromiseLike(resolvedValue)) {
      return resolvedValue;
    }

    return resolvedValue;
  };

  private readonly resolveConfigFunctionSync = (
    loadedConfiguration: unknown,
    sourceFilepath: string,
  ): unknown => {
    if (typeof loadedConfiguration !== 'function') {
      return loadedConfiguration;
    }

    const configFunctionContext: IConfigFunctionContext =
      this.createConfigFunctionContext(sourceFilepath);

    const resolvedValue: unknown = (
      loadedConfiguration as (context: IConfigFunctionContext) => unknown
    )(configFunctionContext);

    if (this.isPromiseLike(resolvedValue)) {
      throw new ConfigError(
        `Config function in "${sourceFilepath}" returned a Promise in sync mode.`,
        'CONFIG_SYNC_FUNCTION_RETURNED_PROMISE',
        undefined,
        [
          'Use createConfiger(...) async API for async config functions.',
          'Return a plain value from the config function when using createConfigerSync(...).',
        ],
      );
    }

    return resolvedValue;
  };

  private readonly resolveEnvironmentName = (): string | undefined => {
    if (this.OPTIONS.envName === false) {
      return undefined;
    }

    if (typeof this.OPTIONS.envName === 'string' && this.OPTIONS.envName.length > 0) {
      return this.OPTIONS.envName;
    }

    const nodeEnvironmentName: string | undefined = process.env.NODE_ENV;

    if (nodeEnvironmentName && nodeEnvironmentName.length > 0) {
      return nodeEnvironmentName;
    }

    return undefined;
  };

  private readonly resolveEnvironmentOverrides = (
    loadedConfiguration: unknown,
    sourceFilepath: string,
  ): unknown => {
    const environmentName: string | undefined = this.resolveEnvironmentName();

    if (!environmentName || !this.isPlainObject(loadedConfiguration)) {
      return loadedConfiguration;
    }

    const directEnvironmentKey: string = `$${environmentName}`;
    const environmentMapOverrideRaw: unknown = loadedConfiguration.$env;
    let mergedEnvironmentOverride: unknown = {};

    for (const [key, value] of Object.entries(loadedConfiguration)) {
      if (!key.startsWith('$') || key === '$env') {
        continue;
      }

      if (!this.isPlainObject(value)) {
        throw new ConfigError(
          `Environment override "${key}" in "${sourceFilepath}" must be an object.`,
          'CONFIG_INVALID_ENVIRONMENT_OVERRIDE',
          undefined,
          [`Use "${key}": { ... } with an object payload.`],
        );
      }

      if (key === directEnvironmentKey) {
        mergedEnvironmentOverride = this.DEEP_MERGE_ADAPTER.merge(mergedEnvironmentOverride, value);
      }
    }

    if (environmentMapOverrideRaw !== undefined) {
      if (!this.isPlainObject(environmentMapOverrideRaw)) {
        throw new ConfigError(
          `Environment override map "$env" in "${sourceFilepath}" must be an object.`,
          'CONFIG_INVALID_ENVIRONMENT_MAP',
          undefined,
          ['Use "$env": { development: { ... }, production: { ... } } format.'],
        );
      }

      const mappedEnvironmentOverride: unknown = environmentMapOverrideRaw[environmentName];

      if (mappedEnvironmentOverride !== undefined) {
        if (!this.isPlainObject(mappedEnvironmentOverride)) {
          throw new ConfigError(
            `Environment override "$env.${environmentName}" in "${sourceFilepath}" must be an object.`,
            'CONFIG_INVALID_ENVIRONMENT_MAP_ENTRY',
            undefined,
            [`Use "$env.${environmentName}": { ... } with an object payload.`],
          );
        }

        mergedEnvironmentOverride = this.DEEP_MERGE_ADAPTER.merge(
          mergedEnvironmentOverride,
          mappedEnvironmentOverride,
        );
      }
    }

    const strippedConfiguration: unknown = this.stripEnvironmentDirectives(loadedConfiguration);

    return this.DEEP_MERGE_ADAPTER.merge(strippedConfiguration, mergedEnvironmentOverride);
  };

  private readonly resolveInheritance = async (
    sourceFilepath: string,
    loadedConfiguration: unknown,
    resolutionStack: Set<string>,
  ): Promise<{ resolvedConfiguration: unknown; sourceFilepaths: Array<string> }> => {
    const inheritanceFilepaths: Array<string> = this.extractInheritanceFilepaths(
      loadedConfiguration,
      sourceFilepath,
    );

    if (inheritanceFilepaths.length === 0) {
      return {
        resolvedConfiguration: loadedConfiguration,
        sourceFilepaths: [sourceFilepath],
      };
    }

    let inheritedConfiguration: unknown = {};
    let sourceFilepaths: Array<string> = [];

    for (const inheritanceFilepath of inheritanceFilepaths) {
      const resolvedInheritancePath: string = path.resolve(
        path.dirname(sourceFilepath),
        inheritanceFilepath,
      );

      const inheritedResult: IConfigResult<TEntity> = await this.readConfigWithContext(
        resolvedInheritancePath,
        resolutionStack,
      );

      inheritedConfiguration = this.DEEP_MERGE_ADAPTER.merge(
        inheritedConfiguration,
        inheritedResult.config,
      );
      sourceFilepaths = [...sourceFilepaths, ...this.resolveResultSources(inheritedResult)];
    }

    const strippedConfiguration: unknown = this.stripInheritanceDirectives(loadedConfiguration);

    return {
      resolvedConfiguration: this.DEEP_MERGE_ADAPTER.merge(
        inheritedConfiguration,
        strippedConfiguration,
      ),
      sourceFilepaths: this.uniqueValues([...sourceFilepaths, sourceFilepath]),
    };
  };

  private readonly resolveInheritanceSync = (
    sourceFilepath: string,
    loadedConfiguration: unknown,
    resolutionStack: Set<string>,
  ): { resolvedConfiguration: unknown; sourceFilepaths: Array<string> } => {
    const inheritanceFilepaths: Array<string> = this.extractInheritanceFilepaths(
      loadedConfiguration,
      sourceFilepath,
    );

    if (inheritanceFilepaths.length === 0) {
      return {
        resolvedConfiguration: loadedConfiguration,
        sourceFilepaths: [sourceFilepath],
      };
    }

    let inheritedConfiguration: unknown = {};
    let sourceFilepaths: Array<string> = [];

    for (const inheritanceFilepath of inheritanceFilepaths) {
      const resolvedInheritancePath: string = path.resolve(
        path.dirname(sourceFilepath),
        inheritanceFilepath,
      );

      const inheritedResult: IConfigResult<TEntity> = this.readConfigSyncWithContext(
        resolvedInheritancePath,
        resolutionStack,
      );

      inheritedConfiguration = this.DEEP_MERGE_ADAPTER.merge(
        inheritedConfiguration,
        inheritedResult.config,
      );
      sourceFilepaths = [...sourceFilepaths, ...this.resolveResultSources(inheritedResult)];
    }

    const strippedConfiguration: unknown = this.stripInheritanceDirectives(loadedConfiguration);

    return {
      resolvedConfiguration: this.DEEP_MERGE_ADAPTER.merge(
        inheritedConfiguration,
        strippedConfiguration,
      ),
      sourceFilepaths: this.uniqueValues([...sourceFilepaths, sourceFilepath]),
    };
  };

  private readonly resolveOnErrorPlugins = async (
    error: Error,
    pluginContext: IPluginContext,
  ): Promise<void> => {
    for (const plugin of this.resolvePlugins()) {
      if (!plugin.onError) {
        continue;
      }

      await plugin.onError(error, pluginContext);
    }
  };

  private readonly resolveOnErrorPluginsSync = (
    error: Error,
    pluginContext: IPluginContext,
  ): void => {
    for (const plugin of this.resolvePlugins()) {
      if (!plugin.onError) {
        continue;
      }

      const pluginResult: Promise<void> | void = plugin.onError(error, pluginContext);
      this.resolveSyncPluginValue(
        pluginResult,
        'CONFIG_SYNC_PLUGIN_HOOK_PROMISE',
        `Plugin "${plugin.name}" returned Promise from "onError" in sync mode.`,
      );
    }
  };

  private readonly resolvePlugins = (): Array<IConfigPlugin<TEntity>> => {
    return this.OPTIONS.plugins ?? [];
  };

  private readonly resolveResultSources = (result: IConfigResult<TEntity>): Array<string> => {
    if (result.sources && result.sources.length > 0) {
      return result.sources;
    }

    return [result.filepath];
  };

  private readonly resolveSchemaValidation = (
    loadedConfiguration: unknown,
    sourceFilepath: string,
  ): unknown => {
    if (!this.OPTIONS.schema) {
      return loadedConfiguration;
    }

    const validationResult: ISchemaValidationResult<unknown> =
      this.SCHEMA_VALIDATOR_ADAPTER.validate(loadedConfiguration, this.OPTIONS.schema);

    if (!validationResult.isValid) {
      const issueSummary: string = validationResult.issues
        .map((issue: ISchemaValidationIssue) => {
          return `- [${issue.code}] ${issue.path}: ${issue.message}`;
        })
        .join('\n');
      const errorMessage: string = `Schema validation failed for "${sourceFilepath}".\n${issueSummary}`;

      throw new ConfigError(errorMessage, 'CONFIG_SCHEMA_VALIDATION_ERROR', undefined, [
        'Provide required fields declared in schema.properties.',
        'Check value types against schema field definitions.',
      ]);
    }

    return validationResult.value;
  };

  private readonly resolveSyncPluginValue = <TValue>(
    inputValue: Promise<TValue> | TValue,
    errorCode: string,
    errorMessage: string,
  ): TValue => {
    if (this.isPromiseLike(inputValue)) {
      throw new ConfigError(errorMessage, errorCode, undefined, [
        'Use createConfiger(...) async API when plugin hooks are async.',
        'Return synchronous values from plugin hooks in sync mode.',
      ]);
    }

    return inputValue;
  };

  private readonly resolveTransform = async (
    result: IConfigResult<TEntity>,
  ): Promise<IConfigResult<TEntity>> => {
    if (!this.OPTIONS.transform) {
      return result;
    }

    return await this.OPTIONS.transform(result);
  };

  private readonly resolveTransformSync = (
    result: IConfigResult<TEntity>,
  ): IConfigResult<TEntity> => {
    if (!this.OPTIONS.transform) {
      return result;
    }

    const transformedResult: IConfigResult<TEntity> | Promise<IConfigResult<TEntity>> =
      this.OPTIONS.transform(result);

    if (this.isPromiseLike(transformedResult)) {
      throw new ConfigError(
        'Transform function returned Promise in sync mode.',
        'CONFIG_SYNC_TRANSFORM_RETURNED_PROMISE',
        undefined,
        [
          'Use createConfiger(...) async API when using async transform.',
          'Return a synchronous value from transform when using createConfigerSync(...).',
        ],
      );
    }

    return transformedResult;
  };

  private readonly stripEnvironmentDirectives = (
    loadedConfiguration: Record<string, unknown>,
  ): Record<string, unknown> => {
    const outputRecord: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(loadedConfiguration)) {
      if (key === '$env' || (key.startsWith('$') && this.isPlainObject(value))) {
        continue;
      }

      outputRecord[key] = value;
    }

    return outputRecord;
  };

  private readonly stripInheritanceDirectives = (configValue: unknown): unknown => {
    if (!this.isPlainObject(configValue)) {
      return configValue;
    }

    const outputRecord: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(configValue)) {
      if (key === '$import' || key === 'extends') {
        continue;
      }

      outputRecord[key] = value;
    }

    return outputRecord;
  };

  private readonly uniqueValues = (values: Array<string>): Array<string> => {
    const seenValues: Set<string> = new Set<string>();
    const outputValues: Array<string> = [];

    for (const value of values) {
      if (seenValues.has(value)) {
        continue;
      }

      seenValues.add(value);
      outputValues.push(value);
    }

    return outputValues;
  };
}
