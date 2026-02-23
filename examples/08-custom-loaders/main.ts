import type { IConfigClient, IConfigResult } from '@elsikora/configer';

import { createConfiger } from '@elsikora/configer';

const EQUALS_SIGN_LENGTH: number = '='.length;

const parseIniLikePayload = (content: string): Record<string, string> => {
  const outputRecord: Record<string, string> = {};
  const lines: Array<string> = content.split('\n');

  for (const line of lines) {
    const trimmedLine: string = line.trim();

    if (trimmedLine.length === 0 || trimmedLine.startsWith('#')) {
      continue;
    }

    const delimiterIndex: number = trimmedLine.indexOf('=');

    if (delimiterIndex < EQUALS_SIGN_LENGTH) {
      continue;
    }

    const key: string = trimmedLine.slice(0, delimiterIndex).trim();
    const value: string = trimmedLine.slice(delimiterIndex + EQUALS_SIGN_LENGTH).trim();
    outputRecord[key] = value;
  }

  return outputRecord;
};

const runExample = async (): Promise<void> => {
  const client: IConfigClient<Record<string, unknown>> = createConfiger({
    cwd: process.cwd(),
    loaders: {
      '.ini': {
        asyncLoader: (_filepath: string, content: string): Record<string, string> => {
          return parseIniLikePayload(content);
        },
        syncLoader: (_filepath: string, content: string): Record<string, string> => {
          return parseIniLikePayload(content);
        },
      },
    },
    moduleName: 'configer',
    searchPlaces: ['app.config.ini'],
    shouldMergeSearchPlaces: false,
  });
  const result: IConfigResult<Record<string, unknown>> | null = await client.findConfig();

  console.warn('Custom loader filepath:', result?.filepath ?? 'No config found');
  console.warn('Custom loader config:', result?.config ?? 'No config found');
};

runExample().catch((error: unknown): void => {
  console.warn('Custom loaders example failed:', error);
});
