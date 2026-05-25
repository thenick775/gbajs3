import { Checkbox, FormControlLabel, type CheckboxProps } from '@mui/material';

import type { ReactNode } from 'react';

type ManagedCheckBoxProps = {
  label: ReactNode;
  watcher?: boolean;
} & CheckboxProps;

// Shared managed checkbox component with label
// Params: takes in label, button props,
// and a watcher indicating the current value
export const ManagedCheckbox = ({
  id,
  label,
  watcher,
  ref,
  ...rest
}: ManagedCheckBoxProps) => (
  <FormControlLabel
    data-testid="managed-checkbox:label"
    id={id}
    control={<Checkbox ref={ref} checked={!!watcher} {...rest} />}
    label={label}
    style={{ margin: 0 }}
  />
);
