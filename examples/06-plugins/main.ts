import type {
  IConfigClient,
  IConfigPlugin,
  IConfigResult,
  IPluginContext,
} from '@elsikora/configer';

import { createConfiger } from '@elsikora/configer';

type TPluginConfiguration = Record<string, unknown>;

const runExample = async (): Promise<void> => {
  const plugin: IConfigPlugin<TPluginConfiguration> = {
    afterFind: (
      result: IConfigResult<TPluginConfiguration> | null,
      _context: IPluginContext,
    ): IConfigResult<TPluginConfiguration> | null => {
      if (!result?.config) {
        return result;
      }

      return {
        ...result,
        config: {
          ...result.config,
          pluginStage: 'after-find',
        },
      };
    },
    afterRead: (
      result: IConfigResult<TPluginConfiguration>,
      _context: IPluginContext,
    ): IConfigResult<TPluginConfiguration> => {
      return {
        ...result,
        config: {
          ...result.config,
          pluginStage: 'after-read',
        },
      };
    },
    beforeFind: (context: IPluginContext): IPluginContext => {
      return {
        ...context,
        searchFrom: context.searchFrom ?? './config',
      };
    },
    beforeRead: (context: IPluginContext): IPluginContext => {
      return context;
    },
    name: 'example-plugin',
    onError: (_error: Error, _context: IPluginContext): void => {
      console.warn('Plugin onError hook received an error.');
    },
  };

  const client: IConfigClient<TPluginConfiguration> = createConfiger({
    cwd: process.cwd(),
    moduleName: 'configer',
    plugins: [plugin],
  });
  const result: IConfigResult<TPluginConfiguration> | null = await client.findConfig();

  console.warn('Plugins example filepath:', result?.filepath ?? 'No config found');
  console.warn('Plugins example config:', result?.config ?? 'No config found');
};

runExample().catch((error: unknown): void => {
  console.warn('Plugins example failed:', error);
});
