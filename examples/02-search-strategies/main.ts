import type { IConfigClient, IConfigResult, TSearchStrategy } from '@elsikora/configer';

import { createConfiger } from '@elsikora/configer';

const runStrategy = async (
  strategy: TSearchStrategy,
  startFrom: string | undefined,
): Promise<IConfigResult<Record<string, unknown>> | null> => {
  const client: IConfigClient<Record<string, unknown>> = createConfiger({
    cwd: process.cwd(),
    moduleName: 'configer',
    searchStrategy: strategy,
  });

  return client.findConfig(startFrom);
};

const runExample = async (): Promise<void> => {
  const noneResult: IConfigResult<Record<string, unknown>> | null = await runStrategy('none');

  const projectResult: IConfigResult<Record<string, unknown>> | null = await runStrategy('project');

  const workspaceResult: IConfigResult<Record<string, unknown>> | null =
    await runStrategy('workspace');

  const globalResult: IConfigResult<Record<string, unknown>> | null = await runStrategy('global');

  console.warn('none strategy filepath:', noneResult?.filepath ?? 'No config found');
  console.warn('project strategy filepath:', projectResult?.filepath ?? 'No config found');
  console.warn('workspace strategy filepath:', workspaceResult?.filepath ?? 'No config found');
  console.warn('global strategy filepath:', globalResult?.filepath ?? 'No config found');
};

runExample().catch((error: unknown): void => {
  console.warn('Search strategies example failed:', error);
});
