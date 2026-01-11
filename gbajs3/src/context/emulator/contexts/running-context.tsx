import { createContext } from 'react';

import type { Dispatch, SetStateAction} from 'react';

interface RunningContextProps {
  isRunning: boolean;
  setIsRunning: Dispatch<SetStateAction<boolean>>;
}

export const RunningContext = createContext<RunningContextProps | null>(null);

RunningContext.displayName = 'RunningContext';
