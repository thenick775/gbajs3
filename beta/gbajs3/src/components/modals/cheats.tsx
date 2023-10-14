import { Button, TextField, useMediaQuery } from '@mui/material';
import { useCallback, useContext, useMemo, useState } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { BiPlus } from 'react-icons/bi';
import { CiSquareRemove } from 'react-icons/ci';
import { styled, useTheme } from 'styled-components';

import { ModalBody } from './modal-body.tsx';
import { ModalFooter } from './modal-footer.tsx';
import { ModalHeader } from './modal-header.tsx';
import { EmulatorContext } from '../../context/emulator/emulator.tsx';
import { ModalContext } from '../../context/modal/modal.tsx';
import { ManagedCheckbox } from '../shared/managed-checkbox.tsx';

type OptionallyHiddenProps = {
  $shouldHide: boolean;
};

type CheatsFormSeparatorProps = {
  $fullWidth?: boolean;
};

type HelpTextProps = {
  $withMargin: boolean;
};

const CheatsList = styled.ul<OptionallyHiddenProps>`
  list-style: none;
  display: ${({ $shouldHide = false }) => ($shouldHide ? 'none' : 'flex')};
  flex-direction: column;
  gap: 10px;
  padding: 10px;
  margin: 0;
  max-width: 100%;
`;

const Cheat = styled.li`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  gap: 10px;
  align-items: center;
  border-bottom: 1px solid ${({ theme }) => theme.pattensBlue};
  padding-bottom: 10px;
  width: 100%;
`;

const StyledCiSquareRemove = styled(CiSquareRemove)`
  min-height: 40px;
  min-width: 40px;
`;

const StyledBiPlus = styled(BiPlus)<OptionallyHiddenProps>`
  width: 25px;
  height: 25px;
  display: ${({ $shouldHide = false }) => ($shouldHide ? 'none' : 'flex')};
`;

const CheatsFormSeparator = styled.div<CheatsFormSeparatorProps>`
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: ${({ $fullWidth = false }) => ($fullWidth ? '100%' : 'auto')};

  @media ${({ theme }) => theme.isLargerThanPhone} {
    flex-direction: row;
  }
`;

const RowContainer = styled.div`
  display: flex;
  flex-direction: row;
  gap: 15px;
  justify-content: space-between;
`;

const HelpText = styled.p<HelpTextProps>`
  margin-bottom: 0;
  margin-left: 0;
  margin-right: 0;
  margin-top: ${({ $withMargin = false }) => ($withMargin ? '5px' : '0')};
`;

export const CheatsModal = () => {
  const theme = useTheme();
  const isLargerThanPhone = useMediaQuery(theme.isLargerThanPhone);
  const { setIsModalOpen } = useContext(ModalContext);
  const { emulator } = useContext(EmulatorContext);
  const [viewRawCheats, setViewRawCheats] = useState(false);
  const defaultCheat = { desc: '', code: '', enable: false };

  const [rawCheats, parsedCheats] = useMemo(() => {
    const cheatsFile = emulator?.getCurrentCheatsFile();
    const rawCheats = new TextDecoder().decode(cheatsFile);

    return [rawCheats, emulator?.parseCheatsString(rawCheats)];
  }, [emulator]);

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors }
  } = useForm({
    defaultValues: {
      rawCheats: rawCheats,
      cheats: parsedCheats?.length ? parsedCheats : [defaultCheat]
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'cheats'
  });

  const refreshForm = useCallback(() => {
    const cheatsFile = emulator?.getCurrentCheatsFile();
    const rawCheats = new TextDecoder().decode(cheatsFile);
    const parsedCheats = emulator?.parseCheatsString(rawCheats) ?? [];

    setValue('rawCheats', rawCheats);
    setValue('cheats', parsedCheats);
  }, [emulator, setValue]);

  return (
    <>
      <ModalHeader title="Manage Cheats" />
      <ModalBody>
        <form
          id="cheatsForm"
          onSubmit={handleSubmit((data) => {
            const cheatsFile = viewRawCheats
              ? new File(
                  [new Blob([data.rawCheats], { type: 'text/plain' })],
                  emulator?.getCurrentCheatsFileName() ?? 'unknown.cheats'
                )
              : emulator?.parsedCheatsToFile(data.cheats);

            if (cheatsFile)
              emulator?.uploadCheats(cheatsFile, () => {
                emulator.autoLoadCheats();
                refreshForm();
              });
          })}
        >
          <TextField
            error={!!errors?.rawCheats}
            label="Raw Libretro Cheats"
            InputLabelProps={{
              shrink: true
            }}
            multiline
            fullWidth
            minRows={6}
            variant="outlined"
            helperText={errors?.rawCheats?.message}
            style={{ display: viewRawCheats ? 'block' : 'none' }}
            {...register('rawCheats')}
          />
          <CheatsList $shouldHide={viewRawCheats}>
            {fields.map((item, index) => (
              <Cheat key={item.id}>
                <CheatsFormSeparator $fullWidth>
                  <TextField
                    label="Name"
                    error={!!errors?.cheats?.[index]?.desc}
                    size="small"
                    autoComplete="Name"
                    style={isLargerThanPhone ? { maxWidth: 100 } : undefined}
                    helperText={errors?.cheats?.[index]?.desc?.message}
                    {...register(`cheats.${index}.desc`, {
                      required: {
                        value: true,
                        message: 'required'
                      }
                    })}
                  />
                  <TextField
                    label="Cheat Code"
                    error={!!errors?.cheats?.[index]?.code}
                    size="small"
                    autoComplete="Code"
                    helperText={errors?.cheats?.[index]?.code?.message}
                    {...register(`cheats.${index}.code`, {
                      required: {
                        value: true,
                        message: 'required'
                      }
                    })}
                  />
                </CheatsFormSeparator>

                <CheatsFormSeparator>
                  <ManagedCheckbox
                    label="Enabled"
                    watcher={watch(`cheats.${index}.enable`)}
                    registerProps={register(`cheats.${index}.enable`)}
                  />
                  <StyledCiSquareRemove onClick={() => remove(index)} />
                </CheatsFormSeparator>
              </Cheat>
            ))}
          </CheatsList>
          <RowContainer>
            <StyledBiPlus
              onClick={() => append(defaultCheat)}
              $shouldHide={viewRawCheats}
            />
            <HelpText $withMargin={viewRawCheats}>
              Join multi-line codes with '+'
            </HelpText>
          </RowContainer>
        </form>
      </ModalBody>
      <ModalFooter>
        <Button form="cheatsForm" type="submit" variant="contained">
          Submit
        </Button>
        <Button
          form="cheatsForm"
          color="info"
          variant="contained"
          onClick={() => setViewRawCheats((prevState) => !prevState)}
        >
          {viewRawCheats ? 'Parsed' : 'Raw'}
        </Button>
        <Button variant="outlined" onClick={() => setIsModalOpen(false)}>
          Close
        </Button>
      </ModalFooter>
    </>
  );
};
