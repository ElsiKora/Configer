import type { IConfigClient, IConfigResult } from '@elsikora/configer';

import { createConfiger } from '@elsikora/configer';

const runExample = async (): Promise<void> => {
  const client: IConfigClient<Record<string, unknown>> = createConfiger({
    cwd: process.cwd(),
    moduleName: 'configer',
  });

  const candidateFilepaths: Array<string> = [
    './config/settings.json',
    './config/settings.yaml',
    './config/settings.toml',
    './config/settings.json5',
    './config/settings.jsonc',
    './config/settings.env',
  ];

  const settledResults: Array<PromiseSettledResult<IConfigResult<Record<string, unknown>>>> =
    await Promise.allSettled(
      candidateFilepaths.map(
        async (filepath: string): Promise<IConfigResult<Record<string, unknown>>> => {
          return client.readConfig(filepath);
        },
      ),
    );

  const successfulResults: Array<IConfigResult<Record<string, unknown>>> = settledResults
    .filter(
      (
        result: PromiseSettledResult<IConfigResult<Record<string, unknown>>>,
      ): result is PromiseFulfilledResult<IConfigResult<Record<string, unknown>>> => {
        return result.status === 'fulfilled';
      },
    )
    .map((result: PromiseFulfilledResult<IConfigResult<Record<string, unknown>>>) => result.value);

  console.warn('Loaded file count:', successfulResults.length);
  console.warn(
    'Loaded filepaths:',
    successfulResults.map((result: IConfigResult<Record<string, unknown>>) => result.filepath),
  );
};

runExample().catch((error: unknown): void => {
  console.warn('File formats example failed:', error);
});
