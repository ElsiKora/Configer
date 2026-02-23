import type { IConfigOptions } from '@domain/entity/config-options.entity';
import type { IDIContainer } from '@elsikora/cladi';

import {
  composeModules,
  createDIContainer,
  EDiContainerCaptiveDependencyPolicy,
  EDiContainerDuplicateProviderPolicy,
} from '@elsikora/cladi';
import { CONFIGER_DI_MODULE } from '@infrastructure/di/module';
import { CONFIGER_DI_TOKEN } from '@infrastructure/di/token.constant';

export const createConfigClientContainer = <TEntity>(
  options: IConfigOptions<TEntity>,
): IDIContainer => {
  const container: IDIContainer = createDIContainer({
    captiveDependencyPolicy: EDiContainerCaptiveDependencyPolicy.ERROR,
    duplicateProviderPolicy: EDiContainerDuplicateProviderPolicy.ERROR,
    scopeName: 'configer',
  });

  composeModules(container, [CONFIGER_DI_MODULE]);
  container.register({
    provide: CONFIGER_DI_TOKEN.CONFIG_OPTIONS,
    useValue: options as IConfigOptions,
  });
  container.validate();

  return container;
};
