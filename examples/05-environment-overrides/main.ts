import type { IConfigClient, IConfigResult } from '@elsikora/configer';

import { createConfiger } from '@elsikora/configer';

type TEnvironmentConfiguration = {
  apiBaseUrl: string;
  isDebugEnabled: boolean;
};

const runExample = async (): Promise<void> => {
  const client: IConfigClient<TEnvironmentConfiguration> = createConfiger({
    cwd: process.cwd(),
    envName: 'development',
    moduleName: 'configer',
    searchPlaces: ['app.config.json'],
    shouldMergeSearchPlaces: false,
  });

  const resolvedResult: IConfigResult<TEnvironmentConfiguration> | null = await client.findConfig();

  console.warn('Environment filepath:', resolvedResult?.filepath ?? 'No config found');
  console.warn('Environment config:', resolvedResult?.config ?? 'No config found');
};

runExample().catch((error: unknown): void => {
  console.warn('Environment overrides example failed:', error);
});
