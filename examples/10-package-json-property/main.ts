import type { IConfigClient, IConfigResult } from '@elsikora/configer';

import { createConfiger } from '@elsikora/configer';

type TPackageJsonConfiguration = {
  isLintEnabled: boolean;
  outputDirectory: string;
};

const runExample = async (): Promise<void> => {
  const client: IConfigClient<TPackageJsonConfiguration> = createConfiger({
    cwd: process.cwd(),
    moduleName: 'configer',
    packageProperty: 'configer',
    searchPlaces: ['package.json'],
    shouldMergeSearchPlaces: false,
  });
  const result: IConfigResult<TPackageJsonConfiguration> | null = await client.findConfig();

  console.warn('Package.json property filepath:', result?.filepath ?? 'No config found');
  console.warn('Package.json property config:', result?.config ?? 'No config found');
};

runExample().catch((error: unknown): void => {
  console.warn('Package.json property example failed:', error);
});
