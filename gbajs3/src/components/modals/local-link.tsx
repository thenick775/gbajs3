import {
  Button,
  Divider,
  FormControl,
  FormHelperText,
  InputLabel,
  MenuItem,
  Select
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { useLocalStorage } from '@uidotdev/usehooks';
import { useId } from 'react';
import { Controller, useForm } from 'react-hook-form';
import toast from 'react-hot-toast';

import { ModalBody } from './modal-body.tsx';
import { ModalFooter } from './modal-footer.tsx';
import { ModalHeader } from './modal-header.tsx';
import {
  emulatorFFMultiplierLocalStorageKey,
  emulatorKeyBindingsLocalStorageKey,
  emulatorSettingsLocalStorageKey,
  emulatorVolumeLocalStorageKey
} from '../../context/emulator/consts.ts';
import {
  useEmulatorContext,
  useModalContext,
  useRunningContext
} from '../../hooks/context.tsx';
import { useAddCallbacks } from '../../hooks/emulator/use-add-callbacks.tsx';

import type { EmulatorSettings } from './emulator-settings.tsx';
import type { KeyBinding } from '../../emulator/mgba/mgba-emulator.tsx';
import type { SubmitHandler } from 'react-hook-form';

const PlayerGroup = styled('div')`
  display: grid;
  gap: 0.75rem;
`;

const HelpText = styled('p')`
  margin-top: 0;
  color: ${({ theme }) => theme.modalTextSecondary};
  line-height: 1.4;
`;

const placeholderText = (value: string, placeholder: string) =>
  value || <em>{placeholder}</em>;

type LinkPlayerInput = {
  rom?: string;
  save?: string;
};

type InputProps = {
  player1: LinkPlayerInput;
  player2: LinkPlayerInput;
};

const StyledForm = styled('form')`
  display: flex;
  flex-direction: column;
  gap: 15px;
`;

export const LocalLinkModal = () => {
  const { emulator } = useEmulatorContext();
  const { closeModal } = useModalContext();
  const { setIsRunning } = useRunningContext();
  const roms = emulator?.listRoms() ?? [];
  const saves = emulator?.listSaves() ?? [];
  const [currentEmulatorVolume] = useLocalStorage(
    emulatorVolumeLocalStorageKey,
    1
  );
  const [fastForwardMultiplier] = useLocalStorage(
    emulatorFFMultiplierLocalStorageKey,
    1
  );
  const [currentKeyBindings] = useLocalStorage<KeyBinding[] | undefined>(
    emulatorKeyBindingsLocalStorageKey
  );
  const [emulatorSettings] = useLocalStorage<EmulatorSettings>(
    emulatorSettingsLocalStorageKey,
    {
      saveFileSystemOnInGameSave: true,
      saveFileSystemOnCreateUpdateDelete: true,
      fileSystemNotificationsEnabled: true,
      allowOpposingDirections: true,
      muteOnFastForward: true,
      muteOnSlowdown: true,
      muteOnRewind: true,
      audioSampleRate: 48000,
      audioBufferSize: 1024,
      timestepSync: true,
      videoSync: false,
      audioSync: false,
      threadedVideo: false,
      rewindEnable: true,
      showFpsCounter: false,
      autoSaveStateLoadNotificationEnabled: true,
      autoSaveStateCaptureNotificationEnabled: true,
      slowdownEnabled: true
    }
  );
  const { addCallbacks } = useAddCallbacks();

  const localLinkFormId = useId();
  const { handleSubmit, control } = useForm<InputProps>();

  const onSubmit: SubmitHandler<InputProps> = (formData) => {
    const player1RomPath = `${emulator?.filePaths().gamePath}/${formData.player1.rom}`;
    const player2RomPath = `${emulator?.filePaths().gamePath}/${formData.player2.rom}`;
    const player1SavePath = formData.player1.save
      ? `${emulator?.filePaths().savePath}/${formData.player1.save}`
      : undefined;
    const player2SavePath = formData.player2.save
      ? `${emulator?.filePaths().savePath}/${formData.player2.save}`
      : undefined;

    emulator?.setVolume(currentEmulatorVolume);
    emulator?.setFastForwardMultiplier(fastForwardMultiplier);
    emulator?.setCoreSettings({
      allowOpposingDirections: emulatorSettings.allowOpposingDirections,
      rewindBufferCapacity: emulatorSettings.rewindBufferCapacity,
      rewindBufferInterval: emulatorSettings.rewindBufferInterval,
      frameSkip: emulatorSettings.frameSkip,
      baseFpsTarget: emulatorSettings.baseFpsTarget,
      audioSampleRate: emulatorSettings.audioSampleRate,
      audioBufferSize: emulatorSettings.audioBufferSize,
      timestepSync: emulatorSettings.timestepSync,
      videoSync: emulatorSettings.videoSync,
      audioSync: emulatorSettings.audioSync,
      threadedVideo: emulatorSettings.threadedVideo,
      rewindEnable: emulatorSettings.rewindEnable,
      showFpsCounter: emulatorSettings.showFpsCounter,
      autoSaveStateTimerIntervalSeconds:
        emulatorSettings.autoSaveStateTimerIntervalSeconds,
      autoSaveStateEnable: emulatorSettings.autoSaveStateEnable,
      restoreAutoSaveStateOnLoad: emulatorSettings.restoreAutoSaveStateOnLoad
    });

    const isSuccessfulRun = emulator?.startLocalLinkSession({
      player1: {
        romPath: player1RomPath,
        savePath: player1SavePath
      },
      player2: {
        romPath: player2RomPath,
        savePath: player2SavePath
      }
    });

    setIsRunning(!!isSuccessfulRun);

    if (isSuccessfulRun) {
      emulator?.setVolume(currentEmulatorVolume);
      emulator?.setFastForwardMultiplier(fastForwardMultiplier);

      if (currentKeyBindings) emulator?.remapKeyBindings(currentKeyBindings);

      addCallbacks({
        saveFileSystemOnInGameSave: emulatorSettings.saveFileSystemOnInGameSave,
        fileSystemNotificationsEnabled:
          emulatorSettings.fileSystemNotificationsEnabled,
        autoSaveStateLoadNotificationEnabled:
          emulatorSettings.autoSaveStateLoadNotificationEnabled,
        autoSaveStateCaptureNotificationEnabled:
          emulatorSettings.autoSaveStateCaptureNotificationEnabled
      });

      emulator?.setCoreSettings({
        allowOpposingDirections: emulatorSettings.allowOpposingDirections,
        frameSkip: emulatorSettings.frameSkip,
        baseFpsTarget: emulatorSettings.baseFpsTarget,
        showFpsCounter: emulatorSettings.showFpsCounter
      });

      toast.success('Local link started. Active player: P1');
      closeModal();
    } else {
      toast.error('Local link failed to start');
    }
  };

  return (
    <>
      <ModalHeader title="Local Link" />
      <ModalBody>
        <HelpText>
          Choose each player's ROM and optional save, then switch active players
          from the in-game menu.
        </HelpText>
        <StyledForm
          aria-label="Local Link Form"
          id={localLinkFormId}
          onSubmit={handleSubmit(onSubmit)}
        >
          <PlayerGroup>
            <Controller
              name="player1.rom"
              control={control}
              rules={{ required: 'Player 1 ROM is required' }}
              render={({ field, fieldState }) => (
                <FormControl size="small" error={!!fieldState.error}>
                  <InputLabel shrink>Player 1 ROM</InputLabel>
                  <Select<string>
                    {...field}
                    value={field.value ?? ''}
                    label="Player 1 ROM"
                    displayEmpty
                    renderValue={(value) =>
                      value || <em>Choose Player 1 ROM</em>
                    }
                  >
                    <MenuItem value="">
                      <em>Choose Player 1 ROM</em>
                    </MenuItem>
                    {roms.map((rom) => (
                      <MenuItem value={rom} key={rom}>
                        {rom}
                      </MenuItem>
                    ))}
                  </Select>
                  <FormHelperText>
                    {fieldState.error?.message ?? ' '}
                  </FormHelperText>
                </FormControl>
              )}
            />
            <Controller
              name="player1.save"
              control={control}
              render={({ field }) => (
                <FormControl size="small">
                  <InputLabel shrink>Player 1 Save</InputLabel>
                  <Select<string>
                    {...field}
                    value={field.value ?? ''}
                    label="Player 1 Save"
                    displayEmpty
                    renderValue={(value) =>
                      placeholderText(value, 'Auto-load / new save')
                    }
                  >
                    <MenuItem value="">
                      <em>Auto-load / new save</em>
                    </MenuItem>
                    {saves.map((save) => (
                      <MenuItem value={save} key={save}>
                        {save}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
            />
          </PlayerGroup>
          <Divider flexItem sx={{ margin: '10px 0' }} />
          <PlayerGroup>
            <Controller
              name="player2.rom"
              control={control}
              rules={{ required: 'Player 2 ROM is required' }}
              render={({ field, fieldState }) => (
                <FormControl size="small" error={!!fieldState.error}>
                  <InputLabel shrink>Player 2 ROM</InputLabel>
                  <Select<string>
                    {...field}
                    value={field.value ?? ''}
                    label="Player 2 ROM"
                    displayEmpty
                    renderValue={(value) =>
                      value || <em>Choose Player 2 ROM</em>
                    }
                  >
                    <MenuItem value="">
                      <em>Choose Player 2 ROM</em>
                    </MenuItem>
                    {roms.map((rom) => (
                      <MenuItem value={rom} key={rom}>
                        {rom}
                      </MenuItem>
                    ))}
                  </Select>
                  <FormHelperText>
                    {fieldState.error?.message ?? ' '}
                  </FormHelperText>
                </FormControl>
              )}
            />
            <Controller
              name="player2.save"
              control={control}
              render={({ field }) => (
                <FormControl size="small">
                  <InputLabel shrink>Player 2 Save</InputLabel>
                  <Select<string>
                    {...field}
                    value={field.value ?? ''}
                    label="Player 2 Save"
                    displayEmpty
                    renderValue={(value) =>
                      placeholderText(value, 'Auto-load / new save')
                    }
                  >
                    <MenuItem value="">
                      <em>Auto-load / new save</em>
                    </MenuItem>
                    {saves.map((save) => (
                      <MenuItem value={save} key={save}>
                        {save}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
            />
          </PlayerGroup>
        </StyledForm>
      </ModalBody>
      <ModalFooter>
        <Button form={localLinkFormId} type="submit" variant="contained">
          Start Local Link
        </Button>
      </ModalFooter>
    </>
  );
};
