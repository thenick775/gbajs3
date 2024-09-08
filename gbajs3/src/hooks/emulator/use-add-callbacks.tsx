import { useLocalStorage } from '@uidotdev/usehooks';
import { useCallback } from 'react';
import toast from 'react-hot-toast';

import { emulatorFSOptionsLocalStorageKey } from '../../context/emulator/consts.ts';
import { useRunningContext, useEmulatorContext } from '../context.tsx';

export type FileSystemOptions = {
  saveFileSystemOnInGameSave: boolean;
  notificationsEnabled?: boolean;
};

// return a function or null based on a condition, null clears the callback in
// question, undefined allows for partial updates if desired in the future
const optionalFunction = (condition: boolean, func: () => void) =>
  condition ? func : null;

export const useAddCallbacks = () => {
  const { isRunning } = useRunningContext();
  const { emulator } = useEmulatorContext();
  const [, setFileSystemOptions] = useLocalStorage<
    FileSystemOptions | undefined
  >(emulatorFSOptionsLocalStorageKey);

  const addCallbacks = useCallback(
    (options: FileSystemOptions) =>
      emulator?.addCoreCallbacks({
        saveDataUpdatedCallback: optionalFunction(
          options.saveFileSystemOnInGameSave,
          () => {
            emulator.fsSync();
            if (options.notificationsEnabled)
              toast.success('Saved File System ');
          }
        )
      }),
    [emulator]
  );

  const addCallbacksAndSaveSettings = useCallback(
    (options: FileSystemOptions) => {
      setFileSystemOptions((prevState) => ({
        ...prevState,
        ...options
      }));

      if (isRunning) addCallbacks(options);
    },
    [addCallbacks, isRunning, setFileSystemOptions]
  );

  return { addCallbacks, addCallbacksAndSaveSettings };
};
