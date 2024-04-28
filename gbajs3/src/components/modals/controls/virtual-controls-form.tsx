import { useMediaQuery } from '@mui/material';
import { useLocalStorage } from '@uidotdev/usehooks';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { styled, useTheme } from 'styled-components';

import { virtualControlsLocalStorageKey } from '../../controls/consts.tsx';
import { ManagedCheckbox } from '../../shared/managed-checkbox.tsx';
import { ManagedSwitch } from '../../shared/managed-switch.tsx';

type VirtualControlsFormProps = {
  id: string;
};

type ControlsInputProps = {
  OpadAndButtons: boolean;
  SaveState: boolean;
  LoadState: boolean;
  QuickReload: boolean;
  SendSaveToServer: boolean;
  NotificationsEnabled: boolean;
};

export type AreVirtualControlsEnabledProps = {
  OpadAndButtons: boolean;
  SaveState: boolean;
  LoadState: boolean;
  QuickReload: boolean;
  SendSaveToServer: boolean;
  NotificationsEnabled: boolean;
};

const StyledForm = styled.form`
  display: flex;
  flex-direction: column;
`;

export const VirtualControlsForm = ({ id }: VirtualControlsFormProps) => {
  const [areVirtualControlsEnabled, setAreVirtualControlsEnabled] =
    useLocalStorage<AreVirtualControlsEnabledProps | undefined>(
      virtualControlsLocalStorageKey
    );
  const theme = useTheme();
  const isLargerThanPhone = useMediaQuery(theme.isLargerThanPhone);

  const shouldShowVirtualControl = (virtualControlEnabled?: boolean) => {
    return (
      (virtualControlEnabled === undefined && !isLargerThanPhone) ||
      !!virtualControlEnabled
    );
  };

  const areVirtualControlsEnabledWithDefaults = Object.fromEntries(
    Object.entries(
      areVirtualControlsEnabled ?? {
        OpadAndButtons: undefined,
        NotificationsEnabled: undefined,
        SaveState: undefined,
        LoadState: undefined,
        QuickReload: undefined,
        SendSaveToServer: undefined
      }
    ).map(([key, value]) => {
      return [
        key,
        key !== 'NotificationsEnabled'
          ? shouldShowVirtualControl(value)
          : value ?? true
      ];
    })
  );

  const { register, handleSubmit, watch } = useForm<ControlsInputProps>({
    values:
      areVirtualControlsEnabledWithDefaults as AreVirtualControlsEnabledProps,
    resetOptions: {
      keepDirtyValues: true
    }
  });

  const onSubmit: SubmitHandler<ControlsInputProps> = async (formData) => {
    setAreVirtualControlsEnabled((prevState) => ({
      ...prevState,
      ...formData
    }));
  };

  return (
    <StyledForm
      aria-label="Virtual Controls Form"
      id={id}
      onSubmit={handleSubmit(onSubmit)}
    >
      <ManagedCheckbox
        label="Virtual D-pad/Buttons"
        watcher={watch('OpadAndButtons')}
        registerProps={register('OpadAndButtons')}
      />
      <ManagedCheckbox
        label="Save State"
        watcher={watch('SaveState')}
        registerProps={register('SaveState')}
      />
      <ManagedCheckbox
        label="Load State"
        watcher={watch('LoadState')}
        registerProps={register('LoadState')}
      />
      <ManagedCheckbox
        label="Quick Reload"
        watcher={watch('QuickReload')}
        registerProps={register('QuickReload')}
      />
      <ManagedCheckbox
        label="Send save to server"
        watcher={watch('SendSaveToServer')}
        registerProps={register('SendSaveToServer')}
      />
      <ManagedSwitch
        label="Enable Notifications"
        watcher={watch('NotificationsEnabled')}
        registerProps={register('NotificationsEnabled')}
      />
    </StyledForm>
  );
};
