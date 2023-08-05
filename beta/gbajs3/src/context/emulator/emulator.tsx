import {
  Dispatch,
  ReactNode,
  SetStateAction,
  createContext,
  useState,
} from 'react';

import { GBAEmulator } from '../../emulator/mgba/mgba-emulator.tsx';
import { useEmulator } from '../../hooks/use-emulator.tsx';

type EmulatorContextProps = {
  emulator: GBAEmulator | null;
  canvas: HTMLCanvasElement | null;
  setCanvas: Dispatch<SetStateAction<HTMLCanvasElement | null>>;
  isEmulatorPaused: boolean;
  isEmulatorRunning: boolean;
  areItemsDraggable: boolean;
  setAreItemsDraggable: Dispatch<SetStateAction<boolean>>;
};

type EmulatorProviderProps = {
  children: ReactNode;
};

export const EmulatorContext = createContext<EmulatorContextProps>({
  emulator: null,
  canvas: null,
  setCanvas: () => undefined,
  isEmulatorPaused: false,
  isEmulatorRunning: false,
  areItemsDraggable: false,
  setAreItemsDraggable: () => undefined,
});

export const EmulatorProvider = ({ children }: EmulatorProviderProps) => {
  const [canvas, setCanvas] = useState<EmulatorContextProps['canvas']>(null);
  const [isEmulatorPaused, setIsPaused] = useState(false);
  const [isEmulatorRunning, setIsRunning] = useState(false);
  const [areItemsDraggable, setAreItemsDraggable] = useState(false);
  const emulator = useEmulator({ canvas, setIsPaused, setIsRunning });

  return (
    <EmulatorContext.Provider
      value={{
        emulator,
        canvas,
        setCanvas,
        isEmulatorPaused,
        isEmulatorRunning,
        areItemsDraggable,
        setAreItemsDraggable,
      }}
    >
      {children}
    </EmulatorContext.Provider>
  );
};
