import {
  lazy,
  Suspense,
  type ComponentType,
  type LazyExoticComponent
} from 'react';

import {
  ModalSuspenseFallback,
  ModalContentFadeIn
} from './modal-suspense-fallback.tsx';

export type ModalComponent = ComponentType<Record<string, never>>;

export const lazyNamedModal = <TModule,>(
  load: () => Promise<TModule>,
  pick: (module: TModule) => ModalComponent
) =>
  lazy(async () => ({
    default: pick(await load())
  }));

export const renderLazyModal = (Modal: LazyExoticComponent<ModalComponent>) => (
  <Suspense fallback={<ModalSuspenseFallback />}>
    <ModalContentFadeIn>
      <Modal />
    </ModalContentFadeIn>
  </Suspense>
);
