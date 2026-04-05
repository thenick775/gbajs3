import { useIsFirstRender, useLocalStorage } from '@uidotdev/usehooks';
import { useEffect, useId, useState } from 'react';
import toast from 'react-hot-toast';

import { useEmulatorContext, useModalContext } from './context.tsx';

export type PublicRomUploadStatus =
  | 'loaded'
  | 'error'
  | 'skipped-error'
  | 'skipped'
  | 'temporarily-dismissed'
  | 'pending';

// key is the url, value is the rom upload status above
export type HasLoadedPublicRoms = Record<string, PublicRomUploadStatus>;

const romURLQueryParamName = 'romURL';
const loadedPublicRomsLocalStorageKey = 'hasLoadedPublicExternalRoms';

export const usePublicRoms = () => {
  const [hasLoadedPublicRoms, setHasLoadedPublicRoms] = useLocalStorage<
    HasLoadedPublicRoms | undefined
  >(loadedPublicRomsLocalStorageKey);
  const isFirstRender = useIsFirstRender();

  const params = new URLSearchParams(window.location.search);
  const romURL = params.get(romURLQueryParamName);

  const shouldShowPublicRomModal =
    !!romURL &&
    hasLoadedPublicRoms?.[romURL] !== 'loaded' &&
    hasLoadedPublicRoms?.[romURL] !== 'skipped' &&
    hasLoadedPublicRoms?.[romURL] !== 'temporarily-dismissed';

  if (isFirstRender)
    setHasLoadedPublicRoms((prevState) =>
      Object.fromEntries(
        Object.entries(prevState ?? {}).map(([key, value]) => [
          key,
          value === 'temporarily-dismissed' ? 'pending' : value
        ])
      )
    );

  return {
    shouldShowPublicRomModal,
    setHasLoadedPublicRoms,
    romURL
  };
};

// Note: query parameters are NOT persisted when saving the app as a PWA to the home screen.
// This is still an outstanding issue that needs to be addressed through other means.
export const useShowLoadPublicRoms = () => {
  const { emulator } = useEmulatorContext();
  const { openModal, isModalOpen } = useModalContext();
  const { shouldShowPublicRomModal, setHasLoadedPublicRoms, romURL } =
    usePublicRoms();
  // prevent modal display from causing issues when dismissed through overlay
  const [attemptedUrls, setAttemptedUrls] = useState<string[]>([]);
  const externalRomToastId = useId();
  const isEmulatorReady = !!emulator;

  useEffect(() => {
    if (
      shouldShowPublicRomModal &&
      romURL &&
      isEmulatorReady &&
      !isModalOpen &&
      !attemptedUrls.includes(romURL)
    ) {
      try {
        const url = new URL(romURL);

        const storeResult = (statusMsg: PublicRomUploadStatus) => {
          setHasLoadedPublicRoms((prevState) => ({
            ...prevState,
            [romURL]: statusMsg
          }));
        };

        openModal({
          type: 'uploadPublicExternalRoms',
          props: {
            url,
            onLoadOrDismiss: storeResult
          }
        });

        // mark url as attempted for this session
        setAttemptedUrls((prev) => [...prev, romURL]);
      } catch {
        toast.error('Invalid external rom URL', { id: externalRomToastId });
        setHasLoadedPublicRoms((prevState) => ({
          ...prevState,
          [romURL]: 'error'
        }));
      }
    }
  }, [
    romURL,
    shouldShowPublicRomModal,
    isEmulatorReady,
    attemptedUrls,
    openModal,
    setHasLoadedPublicRoms,
    isModalOpen,
    externalRomToastId
  ]);
};
