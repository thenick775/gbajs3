import { useIsFirstRender, useLocalStorage } from '@uidotdev/usehooks';
import { useEffect } from 'react';
import toast from 'react-hot-toast';
import {
  PromptLocalStorageKey,
  useShouldShowPrompt
} from 'react-ios-pwa-prompt-ts';

import { useModalContext } from './context.tsx';
import { UploadPublicExternalRomsModal } from '../components/modals/upload-public-external-roms.tsx';
import { productTourLocalStorageKey } from '../components/product-tour/consts.tsx';

import type { CompletedProductTourSteps } from '../components/product-tour/product-tour-intro.tsx';

export type PublicRomUploadStatus =
  | 'loaded'
  | 'error'
  | 'skipped-error'
  | 'skipped';

export type HasLoadedPublicRoms = {
  [url: string]: PublicRomUploadStatus;
};

const romURLQueryParamName = 'romURL';
const loadedPublicRomsLocalStorageKey = 'hasLoadedPublicExternalRoms';

export const useShowLoadPublicRoms = () => {
  const { setModalContent, setIsModalOpen, isModalOpen } = useModalContext();
  const isFirstRender = useIsFirstRender();
  const [hasLoadedPublicRoms, setHasLoadedPublicRoms] = useLocalStorage<
    HasLoadedPublicRoms | undefined
  >(loadedPublicRomsLocalStorageKey);
  const [hasCompletedProductTourSteps] = useLocalStorage<
    CompletedProductTourSteps | undefined
  >(productTourLocalStorageKey);
  const { iosPwaPrompt, shouldShowPrompt } = useShouldShowPrompt({
    promptLocalStorageKey: PromptLocalStorageKey,
    withOutDefaults: true
  });

  const params = new URLSearchParams(window?.location?.search);
  const romURL = params.get(romURLQueryParamName);

  const shouldShowPublicRomModal =
    romURL &&
    hasLoadedPublicRoms?.[romURL] != 'loaded' &&
    hasLoadedPublicRoms?.[romURL] != 'skipped' &&
    hasCompletedProductTourSteps?.hasCompletedProductTourIntro &&
    iosPwaPrompt && // ensure install prompt has come first
    !shouldShowPrompt &&
    !isModalOpen &&
    isFirstRender;

  useEffect(() => {
    if (shouldShowPublicRomModal) {
      try {
        const url = new URL(romURL);

        const storeResult = (statusMsg: PublicRomUploadStatus) => {
          setHasLoadedPublicRoms((prevState) => ({
            ...prevState,
            [romURL]: statusMsg
          }));
        };

        setModalContent(
          <UploadPublicExternalRomsModal
            url={url}
            onLoadOrDismiss={storeResult}
          />
        );
        setIsModalOpen(true);
      } catch {
        toast.error('Invalid external rom URL');
        setHasLoadedPublicRoms((prevState) => ({
          ...prevState,
          [romURL]: 'error'
        }));
      }
    }
  }, [
    romURL,
    shouldShowPublicRomModal,
    setIsModalOpen,
    setModalContent,
    setHasLoadedPublicRoms
  ]);
};
