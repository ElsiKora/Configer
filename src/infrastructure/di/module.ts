import type { IDIModule } from '@elsikora/cladi';

import { createModule } from '@elsikora/cladi';
import { CONFIGER_CLIENT_DI_MODULE } from '@infrastructure/di/client.module';
import { CONFIGER_DI_TOKEN } from '@infrastructure/di/token.constant';

export const CONFIGER_DI_MODULE: IDIModule = createModule({
  exports: [
    CONFIGER_DI_TOKEN.CONFIG_CLIENT_ADAPTER,
    CONFIGER_DI_TOKEN.CONFIG_CLIENT_SYNC_ADAPTER,
    CONFIGER_DI_TOKEN.LOADER_REGISTRY,
  ],
  imports: [CONFIGER_CLIENT_DI_MODULE],
  name: 'configer',
});
