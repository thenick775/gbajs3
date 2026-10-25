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
import { useId } from 'react';
import { Controller, useForm } from 'react-hook-form';
import toast from 'react-hot-toast';

import { ModalBody } from './modal-body.tsx';
import { ModalFooter } from './modal-footer.tsx';
import { ModalHeader } from './modal-header.tsx';
import { useEmulatorContext, useModalContext } from '../../hooks/context.tsx';
import { useStartLocalLinkSession } from '../../hooks/emulator/use-start-local-link-session.tsx';

import type { LocalLinkSessionOptions } from '../../hooks/emulator/use-start-local-link-session.tsx';
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

const StyledForm = styled('form')`
  display: flex;
  flex-direction: column;
  gap: 15px;
`;

const placeholderText = (value: string, placeholder: string) =>
  value || <em>{placeholder}</em>;

export const LocalLinkModal = () => {
  const { emulator } = useEmulatorContext();
  const { closeModal } = useModalContext();
  const roms = emulator?.listRoms() ?? [];
  const saves = emulator?.listSaves() ?? [];
  const startLocalLinkSession = useStartLocalLinkSession();

  const localLinkFormId = useId();
  const { handleSubmit, control } = useForm<LocalLinkSessionOptions>();
  const player1RomLabelId = `${localLinkFormId}-player1-rom-label`;
  const player1SaveLabelId = `${localLinkFormId}-player1-save-label`;
  const player2RomLabelId = `${localLinkFormId}-player2-rom-label`;
  const player2SaveLabelId = `${localLinkFormId}-player2-save-label`;

  const onSubmit: SubmitHandler<LocalLinkSessionOptions> = (formData) => {
    const isSuccessfulRun = startLocalLinkSession(formData);

    if (isSuccessfulRun) {
      toast.success('Local link started. Active player: P1');
      closeModal();
    } else {
      toast.error('Local link failed to start');
    }
  };

  return (
    <>
      <ModalHeader title="Local Link Cable" />
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
                  <InputLabel id={player1RomLabelId} shrink>
                    Player 1 ROM
                  </InputLabel>
                  <Select<string>
                    {...field}
                    labelId={player1RomLabelId}
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
                  <InputLabel id={player1SaveLabelId} shrink>
                    Player 1 Save
                  </InputLabel>
                  <Select<string>
                    {...field}
                    labelId={player1SaveLabelId}
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
                  <InputLabel id={player2RomLabelId} shrink>
                    Player 2 ROM
                  </InputLabel>
                  <Select<string>
                    {...field}
                    labelId={player2RomLabelId}
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
                  <InputLabel id={player2SaveLabelId} shrink>
                    Player 2 Save
                  </InputLabel>
                  <Select<string>
                    {...field}
                    labelId={player2SaveLabelId}
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
