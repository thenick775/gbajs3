import { useMediaQuery } from '@mui/material';
import { useTheme, styled } from '@mui/material/styles';
import { useLocalStorage } from '@uidotdev/usehooks';
import { useForm, useWatch, type SubmitHandler } from 'react-hook-form';

import { useEmulatorContext } from '../../../hooks/context.tsx';
import { virtualControlsLocalStorageKey } from '../../controls/consts.tsx';
import { ManagedCheckbox } from '../../shared/managed-checkbox.tsx';
import { ManagedSwitch } from '../../shared/managed-switch.tsx';

type VirtualControlsFormProps = {
  id: string;
  onAfterSubmit: () => void;
};

export type AreVirtualControlsEnabledProps = {
  OpadAndButtons: boolean;
  SaveState: boolean;
  LoadState: boolean;
  QuickReload: boolean;
  SendSaveToServer: boolean;
  LocalLinkPlayerSwitch: boolean;
  NotificationsEnabled: boolean;
};

type ControlsInputProps = AreVirtualControlsEnabledProps;

const StyledForm = styled('form')`
  display: flex;
  flex-direction: column;
`;

export const VirtualControlsForm = ({
  id,
  onAfterSubmit
}: VirtualControlsFormProps) => {
  const [areVirtualControlsEnabled, setAreVirtualControlsEnabled] =
    useLocalStorage<AreVirtualControlsEnabledProps | undefined>(
      virtualControlsLocalStorageKey
    );
  const { emulator } = useEmulatorContext();
  const theme = useTheme();
  const isLargerThanPhone = useMediaQuery(theme.isLargerThanPhone);
  const isMobileLandscape = useMediaQuery(theme.isMobileLandscape);
  const localLinkStatus = emulator?.getLocalLinkStatus();

  const shouldShowVirtualControl = (virtualControlEnabled?: boolean) => {
    return (
      (virtualControlEnabled === undefined &&
        (!isLargerThanPhone || isMobileLandscape)) ||
      !!virtualControlEnabled
    );
  };

  const { register, handleSubmit, control } = useForm<ControlsInputProps>({
    values: {
      OpadAndButtons: shouldShowVirtualControl(
        areVirtualControlsEnabled?.OpadAndButtons
      ),
      SaveState: shouldShowVirtualControl(areVirtualControlsEnabled?.SaveState),
      LoadState: shouldShowVirtualControl(areVirtualControlsEnabled?.LoadState),
      QuickReload: shouldShowVirtualControl(
        areVirtualControlsEnabled?.QuickReload
      ),
      SendSaveToServer: shouldShowVirtualControl(
        areVirtualControlsEnabled?.SendSaveToServer
      ),
      LocalLinkPlayerSwitch:
        areVirtualControlsEnabled?.LocalLinkPlayerSwitch ??
        !!localLinkStatus?.running,
      NotificationsEnabled:
        areVirtualControlsEnabled?.NotificationsEnabled ?? true
    },
    resetOptions: {
      keepDirtyValues: true
    }
  });
  const watchedControls = useWatch({ control });

  const onSubmit: SubmitHandler<ControlsInputProps> = (formData) => {
    setAreVirtualControlsEnabled((prevState) => ({
      ...prevState,
      ...formData
    }));
    onAfterSubmit();
  };

  return (
    <StyledForm
      aria-label="Virtual Controls Form"
      id={id}
      onSubmit={handleSubmit(onSubmit)}
    >
      <ManagedCheckbox
        label="Virtual D-pad/Buttons"
        watcher={watchedControls.OpadAndButtons}
        {...register('OpadAndButtons')}
      />
      <ManagedCheckbox
        label="Save State"
        watcher={watchedControls.SaveState}
        {...register('SaveState')}
      />
      <ManagedCheckbox
        label="Load State"
        watcher={watchedControls.LoadState}
        {...register('LoadState')}
      />
      <ManagedCheckbox
        label="Quick Reload"
        watcher={watchedControls.QuickReload}
        {...register('QuickReload')}
      />
      <ManagedCheckbox
        label="Send save to server"
        watcher={watchedControls.SendSaveToServer}
        {...register('SendSaveToServer')}
      />
      <ManagedCheckbox
        label="Local Link Player Switch"
        watcher={watchedControls.LocalLinkPlayerSwitch}
        {...register('LocalLinkPlayerSwitch')}
      />
      <ManagedSwitch
        label="Enable Notifications"
        watcher={watchedControls.NotificationsEnabled}
        {...register('NotificationsEnabled')}
      />
    </StyledForm>
  );
};
