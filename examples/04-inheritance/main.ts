import type { IConfigClient, IConfigResult } from '@elsikora/configer';

import { createConfiger } from '@elsikora/configer';

type TInheritanceConfiguration = {
  features: {
    isAuditEnabled: boolean;
    isMetricsEnabled: boolean;
  };
  serviceName: string;
};

const runExample = async (): Promise<void> => {
  const client: IConfigClient<TInheritanceConfiguration> = createConfiger({
    cwd: process.cwd(),
    moduleName: 'configer',
    searchPlaces: ['app.config.json'],
    shouldMergeSearchPlaces: false,
  });

  const resolvedResult: IConfigResult<TInheritanceConfiguration> | null = await client.findConfig();

  console.warn('Resolved inheritance filepath:', resolvedResult?.filepath ?? 'No config found');
  console.warn('Resolved inheritance config:', resolvedResult?.config ?? 'No config found');
};

runExample().catch((error: unknown): void => {
  console.warn('Inheritance example failed:', error);
});
