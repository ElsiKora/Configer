import type { IConfigClient, IConfigResult, ISchemaDescriptor } from '@elsikora/configer';

import { createConfiger } from '@elsikora/configer';

const DECIMAL_RADIX: number = '0123456789'.length;
const DEFAULT_RETRY_COUNT: number = Number.parseInt('3', DECIMAL_RADIX);

type TSchemaConfiguration = {
  retryCount: number;
  serviceName: string;
};

const runExample = async (): Promise<void> => {
  const schemaDescriptor: ISchemaDescriptor<TSchemaConfiguration> = {
    properties: {
      retryCount: {
        defaultValue: DEFAULT_RETRY_COUNT,
        type: 'number',
      },
      serviceName: {
        isRequired: true,
        type: 'string',
      },
    },
    shouldAllowUnknownProperties: false,
    type: 'object',
  };

  const client: IConfigClient<TSchemaConfiguration> = createConfiger({
    cwd: process.cwd(),
    moduleName: 'configer',
    schema: schemaDescriptor,
  });
  const result: IConfigResult<TSchemaConfiguration> | null = await client.findConfig();

  console.warn('Schema example filepath:', result?.filepath ?? 'No config found');
  console.warn('Schema example config:', result?.config ?? 'No config found');
};

runExample().catch((error: unknown): void => {
  console.warn('Schema validation example failed:', error);
});
