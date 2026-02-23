import type { IConfigClient, IConfigClientSync, IConfigResult } from '@elsikora/configer';

import { createConfiger, createConfigerSync } from '@elsikora/configer';

type TBasicExampleConfiguration = {
  isFeatureEnabled: boolean;
  serviceName: string;
};

const runExample = async (): Promise<void> => {
  const workingDirectory: string = process.cwd();
  const moduleName: string = 'configer';

  const asyncClient: IConfigClient<TBasicExampleConfiguration> = createConfiger({
    cwd: workingDirectory,
    moduleName,
  });

  const syncClient: IConfigClientSync<TBasicExampleConfiguration> = createConfigerSync({
    cwd: workingDirectory,
    moduleName,
  });

  const asyncResult: IConfigResult<TBasicExampleConfiguration> | null =
    await asyncClient.findConfig();
  const syncResult: IConfigResult<TBasicExampleConfiguration> | null = syncClient.findConfig();

  console.warn('Async result filepath:', asyncResult?.filepath ?? 'No config found');
  console.warn('Sync result filepath:', syncResult?.filepath ?? 'No config found');
};

runExample().catch((error: unknown): void => {
  console.warn('Basic usage example failed:', error);
});
