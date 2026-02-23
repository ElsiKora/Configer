import type { IConfigClient, IConfigResult, IWatchHandle } from '@elsikora/configer';

import { setTimeout as delay } from 'node:timers/promises';

import { createConfiger } from '@elsikora/configer';

const DECIMAL_RADIX: number = '0123456789'.length;
const WAIT_SHORT_MS: number = Number.parseInt('200', DECIMAL_RADIX);
const WAIT_LONG_MS: number = Number.parseInt('1000', DECIMAL_RADIX);

const runExample = async (): Promise<void> => {
  const client: IConfigClient<Record<string, unknown>> = createConfiger({
    cwd: process.cwd(),
    moduleName: 'configer',
  });
  let hasReceivedChangeEvent: boolean = false;

  const watchHandle: IWatchHandle = client.watchConfig(
    (error: Error | null, result: IConfigResult<Record<string, unknown>> | null): void => {
      if (error) {
        console.warn('Watch callback error:', error);

        return;
      }

      hasReceivedChangeEvent = true;
      console.warn('Watch callback filepath:', result?.filepath ?? 'No config found');
    },
  );

  await delay(WAIT_SHORT_MS);

  if (!hasReceivedChangeEvent) {
    console.warn('No watch change event received during demo timeout.');
  }

  await delay(WAIT_LONG_MS);
  watchHandle.close();
};

runExample().catch((error: unknown): void => {
  console.warn('Watch mode example failed:', error);
});
