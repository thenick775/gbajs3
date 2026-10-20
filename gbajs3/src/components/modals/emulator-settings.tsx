import {
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Tab,
  Tabs,
  TextField
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { useLocalStorage } from '@uidotdev/usehooks';
import { useId, useState, type ReactNode } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';

import { ModalBody } from './modal-body.tsx';
import { ModalFooter } from './modal-footer.tsx';
import { ModalHeader } from './modal-header.tsx';
import { emulatorSettingsLocalStorageKey } from '../../context/emulator/consts.ts';
import {
  useEmulatorContext,
  useModalContext,
  useRunningContext
} from '../../hooks/context.tsx';
import { useAddCallbacks } from '../../hooks/emulator/use-add-callbacks.tsx';
import { CircleCheckButton } from '../shared/circle-check-button.tsx';
import { ManagedCheckbox } from '../shared/managed-checkbox.tsx';
import { NumberInput } from '../shared/number-input.tsx';

import type { SubmitHandler } from 'react-hook-form';

export type EmulatorSettings = {
  allowOpposingDirections: boolean;
  fileSystemNotificationsEnabled: boolean;
  frameSkip?: number;
  baseFpsTarget?: number;
  muteOnFastForward: boolean;
  muteOnSlowdown: boolean;
  muteOnRewind: boolean;
  rewindBufferCapacity?: number;
  rewindBufferInterval?: number;
  saveFileName?: string;
  saveFileSystemOnCreateUpdateDelete: boolean;
  saveFileSystemOnInGameSave: boolean;
  audioSampleRate?: number;
  audioBufferSize?: number;
  timestepSync: boolean;
  videoSync: boolean;
  audioSync: boolean;
  threadedVideo: boolean;
  rewindEnable: boolean;
  showFpsCounter: boolean;
  autoSaveStateTimerIntervalSeconds?: number;
  autoSaveStateEnable?: boolean;
  restoreAutoSaveStateOnLoad?: boolean;
  autoSaveStateLoadNotificationEnabled: boolean;
  autoSaveStateCaptureNotificationEnabled: boolean;
  slowdownEnabled: boolean;
};

type TabPanelProps = {
  children: ReactNode;
  index: number;
  value: number;
};

const StyledForm = styled('form')`
  display: flex;
  flex-direction: column;
  gap: 15px;
`;

const StyledModalBody = styled(ModalBody)`
  padding: 0;
`;

const TabWrapper = styled('div')`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1rem;
`;

const TabFlexWrapper = styled('div')`
  flex-grow: 1;
  display: flex;
`;

const TabPanel = ({ children, index, value }: TabPanelProps) => (
  <div
    role="tabpanel"
    hidden={value !== index}
    id={`tabpanel-${index}`}
    aria-labelledby={`tab-${index}`}
    style={{ width: '100%' }}
  >
    <TabWrapper>{children}</TabWrapper>
  </div>
);

const a11yProps = (index: number) => ({
  id: `settings-tab-${index}`,
  'aria-controls': `tabpanel-${index}`
});

export const EmulatorSettingsModal = () => {
  const { emulator } = useEmulatorContext();
  const { isRunning } = useRunningContext();
  const { closeModal } = useModalContext();
  const { addCallbacks } = useAddCallbacks();
  const [emulatorSettings, setEmulatorSettings] = useLocalStorage<
    EmulatorSettings | undefined
  >(emulatorSettingsLocalStorageKey);
  const {
    register,
    reset,
    control,
    handleSubmit,
    formState: { isSubmitSuccessful }
  } = useForm<EmulatorSettings>({
    values: {
      frameSkip: emulatorSettings?.frameSkip ?? 0,
      baseFpsTarget: emulatorSettings?.baseFpsTarget ?? 60,
      rewindBufferCapacity: emulatorSettings?.rewindBufferCapacity ?? 600,
      rewindBufferInterval: emulatorSettings?.rewindBufferInterval ?? 1,
      allowOpposingDirections:
        emulatorSettings?.allowOpposingDirections ?? true,
      muteOnFastForward: emulatorSettings?.muteOnFastForward ?? true,
      muteOnSlowdown: emulatorSettings?.muteOnSlowdown ?? true,
      muteOnRewind: emulatorSettings?.muteOnRewind ?? true,
      saveFileName:
        emulatorSettings?.saveFileName ??
        (isRunning ? emulator?.getCurrentSaveName() : ''),
      saveFileSystemOnInGameSave:
        emulatorSettings?.saveFileSystemOnInGameSave ?? true,
      saveFileSystemOnCreateUpdateDelete:
        emulatorSettings?.saveFileSystemOnCreateUpdateDelete ?? true,
      fileSystemNotificationsEnabled:
        emulatorSettings?.fileSystemNotificationsEnabled ?? true,
      audioSampleRate: emulatorSettings?.audioSampleRate ?? 48000,
      audioBufferSize: emulatorSettings?.audioBufferSize ?? 1024,
      timestepSync: emulatorSettings?.timestepSync ?? true,
      videoSync: emulatorSettings?.videoSync ?? false,
      audioSync: emulatorSettings?.audioSync ?? false,
      threadedVideo: emulatorSettings?.threadedVideo ?? false,
      rewindEnable: emulatorSettings?.rewindEnable ?? true,
      showFpsCounter: emulatorSettings?.showFpsCounter ?? false,
      autoSaveStateTimerIntervalSeconds:
        emulatorSettings?.autoSaveStateTimerIntervalSeconds ?? 30,
      autoSaveStateEnable: emulatorSettings?.autoSaveStateEnable ?? true,
      restoreAutoSaveStateOnLoad:
        emulatorSettings?.restoreAutoSaveStateOnLoad ?? true,
      autoSaveStateLoadNotificationEnabled:
        emulatorSettings?.autoSaveStateLoadNotificationEnabled ?? true,
      autoSaveStateCaptureNotificationEnabled:
        emulatorSettings?.autoSaveStateCaptureNotificationEnabled ?? true,
      slowdownEnabled: emulatorSettings?.slowdownEnabled ?? true
    }
  });
  const [tabValue, setTabValue] = useState(0);
  const emulatorSettingsFormId = useId();
  const watchedSettings = useWatch({ control });

  const defaultAudioSampleRates = emulator?.defaultAudioSampleRates();
  const defaultAudioBufferSizes = emulator?.defaultAudioBufferSizes();
  const renderedAudioSampleRate = defaultAudioSampleRates
    ? watchedSettings.audioSampleRate
    : '';
  const renderedAudioBufferSize = defaultAudioBufferSizes
    ? watchedSettings.audioBufferSize
    : '';

  const onSubmit: SubmitHandler<EmulatorSettings> = ({
    saveFileName,
    ...rest
  }) => {
    setEmulatorSettings({
      ...rest,
      saveFileName:
        !!saveFileName && saveFileName !== emulator?.getCurrentSaveName()
          ? saveFileName
          : undefined
    });

    addCallbacks({
      saveFileSystemOnInGameSave: rest.saveFileSystemOnInGameSave,
      fileSystemNotificationsEnabled: rest.fileSystemNotificationsEnabled,
      autoSaveStateLoadNotificationEnabled:
        rest.autoSaveStateLoadNotificationEnabled,
      autoSaveStateCaptureNotificationEnabled:
        rest.autoSaveStateCaptureNotificationEnabled
    });

    emulator?.setCoreSettings({
      allowOpposingDirections: rest.allowOpposingDirections,
      frameSkip: rest.frameSkip,
      baseFpsTarget: rest.baseFpsTarget,
      rewindBufferCapacity: rest.rewindBufferCapacity,
      rewindBufferInterval: rest.rewindBufferInterval,
      audioSampleRate: rest.audioSampleRate,
      audioBufferSize: rest.audioBufferSize,
      timestepSync: rest.timestepSync,
      videoSync: rest.videoSync,
      audioSync: rest.audioSync,
      threadedVideo: rest.threadedVideo,
      rewindEnable: rest.rewindEnable,
      showFpsCounter: rest.showFpsCounter,
      autoSaveStateTimerIntervalSeconds: rest.autoSaveStateTimerIntervalSeconds,
      autoSaveStateEnable: rest.autoSaveStateEnable,
      restoreAutoSaveStateOnLoad: rest.restoreAutoSaveStateOnLoad
    });
  };

  const resetEmulatorSettings = () => {
    setEmulatorSettings(undefined);
    reset();

    addCallbacks({
      saveFileSystemOnInGameSave: true,
      fileSystemNotificationsEnabled: true,
      autoSaveStateLoadNotificationEnabled: true,
      autoSaveStateCaptureNotificationEnabled: true
    });

    emulator?.setCoreSettings({
      allowOpposingDirections: true,
      frameSkip: 0,
      baseFpsTarget: 60,
      rewindBufferCapacity: 600,
      rewindBufferInterval: 1,
      audioSampleRate: 48000,
      audioBufferSize: 1024,
      timestepSync: true,
      videoSync: false,
      audioSync: false,
      threadedVideo: false,
      rewindEnable: true,
      showFpsCounter: false,
      autoSaveStateTimerIntervalSeconds: 30,
      autoSaveStateEnable: true,
      restoreAutoSaveStateOnLoad: true
    });
  };

  const handleTabChange = (_: React.SyntheticEvent, tabIndex: number) => {
    setTabValue(tabIndex);
  };

  return (
    <>
      <ModalHeader title="Emulator Settings" />
      <StyledModalBody>
        <StyledForm
          id={emulatorSettingsFormId}
          aria-label="Emulator Settings Form"
          onSubmit={handleSubmit(onSubmit)}
        >
          <TabFlexWrapper>
            <Tabs
              orientation="vertical"
              variant="scrollable"
              value={tabValue}
              onChange={handleTabChange}
              aria-label="Settings tabs"
              sx={{
                borderRight: 1,
                borderColor: 'divider',
                minWidth: 'fit-content'
              }}
            >
              <Tab label="Game" {...a11yProps(0)} />
              <Tab label="Audio" {...a11yProps(1)} />
              <Tab label="Video" {...a11yProps(2)} />
              <Tab label="File" {...a11yProps(3)} />
              <Tab label="Alert" {...a11yProps(4)} />
            </Tabs>
            <TabPanel value={tabValue} index={0}>
              <Controller
                control={control}
                name="saveFileName"
                render={({ field: { name, value, ...rest } }) => (
                  <TextField
                    value={value}
                    name={name}
                    label="Save File Name"
                    variant="outlined"
                    size="small"
                    disabled={isRunning}
                    {...rest}
                  />
                )}
              />
              <NumberInput
                label="Rewind Capacity"
                min={1}
                max={3600}
                size="small"
                {...register('rewindBufferCapacity', {
                  required: {
                    value: true,
                    message: 'Rewind buffer capacity is required'
                  },
                  valueAsNumber: true
                })}
              />
              <NumberInput
                label="Rewind Interval"
                min={1}
                max={100}
                size="small"
                {...register('rewindBufferInterval', {
                  required: {
                    value: true,
                    message: 'Rewind buffer interval is required'
                  },
                  valueAsNumber: true
                })}
              />
              <NumberInput
                label="Auto Save State Interval"
                min={1}
                max={100}
                size="small"
                {...register('autoSaveStateTimerIntervalSeconds', {
                  required: {
                    value: true,
                    message: 'Auto save state interval is required'
                  },
                  valueAsNumber: true
                })}
              />
              <ManagedCheckbox
                label="Allow opposing directions"
                watcher={watchedSettings.allowOpposingDirections}
                {...register('allowOpposingDirections')}
              />
              <ManagedCheckbox
                label="Rewind enabled"
                watcher={watchedSettings.rewindEnable}
                {...register('rewindEnable')}
              />
              <ManagedCheckbox
                label="Slowdown enabled"
                watcher={watchedSettings.slowdownEnabled}
                {...register('slowdownEnabled')}
              />
              <ManagedCheckbox
                label="Auto save state enabled"
                watcher={watchedSettings.autoSaveStateEnable}
                {...register('autoSaveStateEnable')}
              />
              <ManagedCheckbox
                label="Restore auto save state"
                watcher={watchedSettings.restoreAutoSaveStateOnLoad}
                {...register('restoreAutoSaveStateOnLoad')}
              />
            </TabPanel>
            <TabPanel value={tabValue} index={1}>
              <FormControl size="small">
                <InputLabel>Audio Sample Rate</InputLabel>
                <Select
                  label="Audio Sample Rate"
                  disabled={isRunning}
                  value={renderedAudioSampleRate}
                  {...register('audioSampleRate', {
                    required: {
                      value: true,
                      message: 'Sample rate is required'
                    },
                    valueAsNumber: true
                  })}
                >
                  {defaultAudioSampleRates?.map((sampleRate, idx) => (
                    <MenuItem key={`${sampleRate}_${idx}`} value={sampleRate}>
                      {sampleRate}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl size="small">
                <InputLabel>Audio Buffer Size</InputLabel>
                <Select
                  label="Audio Buffer Size"
                  disabled={isRunning}
                  value={renderedAudioBufferSize}
                  {...register('audioBufferSize', {
                    required: {
                      value: true,
                      message: 'Buffer size is required'
                    },
                    valueAsNumber: true
                  })}
                >
                  {defaultAudioBufferSizes?.map((bufferSize, idx) => (
                    <MenuItem key={`${bufferSize}_${idx}`} value={bufferSize}>
                      {bufferSize}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <ManagedCheckbox
                label="Mute on rewind"
                watcher={watchedSettings.muteOnRewind}
                {...register('muteOnRewind')}
              />
              <ManagedCheckbox
                label="Mute on fast forward"
                watcher={watchedSettings.muteOnFastForward}
                {...register('muteOnFastForward')}
              />
              <ManagedCheckbox
                label="Mute on slowdown"
                watcher={watchedSettings.muteOnSlowdown}
                {...register('muteOnSlowdown')}
              />
            </TabPanel>
            <TabPanel value={tabValue} index={2}>
              <NumberInput
                label="Base FPS Target"
                min={0}
                size="small"
                {...register('baseFpsTarget', {
                  required: {
                    value: true,
                    message: 'Base FPS target is required'
                  },
                  valueAsNumber: true
                })}
              />
              <NumberInput
                label="Frame Skip"
                min={0}
                max={32}
                size="small"
                {...register('frameSkip', {
                  required: { value: true, message: 'Frame skip is required' },
                  valueAsNumber: true
                })}
              />
              <ManagedCheckbox
                label="Timestep Sync"
                watcher={watchedSettings.timestepSync}
                {...register('timestepSync')}
              />
              <ManagedCheckbox
                label="Video Sync"
                watcher={watchedSettings.videoSync}
                {...register('videoSync')}
              />
              <ManagedCheckbox
                label="Audio Sync"
                watcher={watchedSettings.audioSync}
                {...register('audioSync')}
              />
              <ManagedCheckbox
                label="FPS Counter"
                watcher={watchedSettings.showFpsCounter}
                {...register('showFpsCounter')}
              />
              <ManagedCheckbox
                label="Threaded Video"
                watcher={watchedSettings.threadedVideo}
                {...register('threadedVideo')}
              />
            </TabPanel>
            <TabPanel value={tabValue} index={3}>
              <ManagedCheckbox
                label="Save file system on create / update / delete"
                watcher={watchedSettings.saveFileSystemOnCreateUpdateDelete}
                {...register('saveFileSystemOnCreateUpdateDelete')}
              />
              <ManagedCheckbox
                label="Save file system on in-game save"
                watcher={watchedSettings.saveFileSystemOnInGameSave}
                {...register('saveFileSystemOnInGameSave')}
              />
            </TabPanel>
            <TabPanel value={tabValue} index={4}>
              <ManagedCheckbox
                label="File system notifications"
                watcher={watchedSettings.fileSystemNotificationsEnabled}
                {...register('fileSystemNotificationsEnabled')}
              />
              <ManagedCheckbox
                label="Auto save state load notification"
                watcher={watchedSettings.autoSaveStateLoadNotificationEnabled}
                {...register('autoSaveStateLoadNotificationEnabled')}
              />
              <ManagedCheckbox
                label="Auto save state capture notification"
                watcher={watchedSettings.autoSaveStateCaptureNotificationEnabled}
                {...register('autoSaveStateCaptureNotificationEnabled')}
              />
            </TabPanel>
          </TabFlexWrapper>
        </StyledForm>
      </StyledModalBody>
      <ModalFooter>
        <CircleCheckButton
          copy="Save"
          form={emulatorSettingsFormId}
          showSuccess={isSubmitSuccessful}
          type="submit"
        />
        <Button
          color="info"
          variant="contained"
          onClick={resetEmulatorSettings}
        >
          Reset
        </Button>
        <Button variant="outlined" onClick={closeModal}>
          Close
        </Button>
      </ModalFooter>
    </>
  );
};
