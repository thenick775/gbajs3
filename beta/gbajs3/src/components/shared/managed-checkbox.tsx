import { Checkbox, FormControlLabel } from '@mui/material';

import type { UseFormRegisterReturn } from 'react-hook-form';

type ManagedCheckBoxProps = {
  label: string;
  registerProps: UseFormRegisterReturn;
  watcher?: boolean;
};

// Shared managed checkbox component with label
// Params: takes in label, react hook form register props,
//         and a watcher indicating the current value
export const ManagedCheckbox = ({
  label,
  registerProps,
  watcher
}: ManagedCheckBoxProps) => {
  return (
    <FormControlLabel
      control={<Checkbox {...registerProps} checked={!!watcher} />}
      label={label}
      style={{ margin: 0 }}
    />
  );
};
