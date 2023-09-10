import { Button, Tabs, Tab } from '@mui/material';
import { useContext, useEffect, useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import styled, { useTheme } from 'styled-components';
import { useLocalStorage, useMediaQuery } from 'usehooks-ts';

import { ModalBody } from './modal-body.tsx';
import { ModalFooter } from './modal-footer.tsx';
import { ModalHeader } from './modal-header.tsx';
import { ModalContext } from '../../context/modal/modal.tsx';
import { ManagedCheckbox } from '../shared/managed-checkbox.tsx';

type TabPanelProps = {
  children: React.ReactNode;
  index: number;
  value: number;
};

type ControlsInputProps = {
  DPadAndButtons: boolean;
  SaveState: boolean;
  LoadState: boolean;
  QuickReload: boolean;
  SendSaveToServer: boolean;
};

export type AreVirtualControlsEnabledProps = {
  DPadAndButtons?: boolean;
  SaveState?: boolean;
  LoadState?: boolean;
  QuickReload?: boolean;
  SendSaveToServer?: boolean;
};

const TabsWithBorder = styled(Tabs)`
  border-bottom: 1px solid;
  border-color: rgba(0, 0, 0, 0.12);
`;

const StyledForm = styled.form`
  display: flex;
  flex-direction: column;
`;

const TabWrapper = styled.div`
  padding: 24px;
`;

const VirtualControlsForm = () => {
  const [areVirtualControlsEnabled, setareVirtualControlsEnabled] =
    useLocalStorage<AreVirtualControlsEnabledProps>(
      'areVirtualControlsEnabled',
      {}
    );
  const theme = useTheme();
  const isLargerThanPhone = useMediaQuery(theme.isLargerThanPhone);
  const areDPadAndButtonsEnabled =
    areVirtualControlsEnabled?.DPadAndButtons ??
    (areVirtualControlsEnabled?.DPadAndButtons === undefined &&
      !isLargerThanPhone);

  const { register, handleSubmit, setValue, watch } =
    useForm<ControlsInputProps>({
      defaultValues: {
        ...areVirtualControlsEnabled,
        DPadAndButtons: areDPadAndButtonsEnabled
      }
    });

  useEffect(() => {
    // DPadAndButtons is the only value that can dynamically change without user input
    setValue('DPadAndButtons', areDPadAndButtonsEnabled);
  }, [areDPadAndButtonsEnabled, setValue]);

  const onSubmit: SubmitHandler<ControlsInputProps> = async (formData) => {
    setareVirtualControlsEnabled((prevState) => ({
      ...prevState,
      ...formData
    }));
  };

  return (
    <StyledForm id="virtualControlsForm" onSubmit={handleSubmit(onSubmit)}>
      <ManagedCheckbox
        label="Virtual D-pad/Buttons"
        watcher={watch('DPadAndButtons')}
        registerProps={register('DPadAndButtons')}
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
    </StyledForm>
  );
};

const KeyBindingsForm = () => {
  return (
    <StyledForm id="keyBindingsForm">
      <table id="controlsTable">
        <thead>
          <tr>
            <th scope="col">GBA Input</th>
            <th scope="col">Key Binding</th>
          </tr>
        </thead>
        <tbody></tbody>
      </table>
    </StyledForm>
  );
};

const TabPanel = ({ children, index, value }: TabPanelProps) => {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}`}
    >
      {value === index && <TabWrapper>{children}</TabWrapper>}
    </div>
  );
};

const a11yProps = (index: number) => {
  return {
    id: `control-tab-${index}`,
    'aria-controls': `tabpanel-${index}`
  };
};

type ControlTabsProps = {
  setFormId: React.Dispatch<React.SetStateAction<string | null>>;
};

const ControlTabs = ({ setFormId }: ControlTabsProps) => {
  const [value, setValue] = useState(0);

  const handleChange = (_: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  useEffect(() => {
    if (value === 0) {
      setFormId('virtualControlsForm');
    } else if (value === 1) {
      setFormId('keyBindingsForm');
    }
  }, [value, setFormId]);

  return (
    <>
      <TabsWithBorder
        value={value}
        onChange={handleChange}
        aria-label="control tabs"
      >
        <Tab label="Virtual Controls" {...a11yProps(0)} />
        <Tab label="Key Bindings" {...a11yProps(1)} />
      </TabsWithBorder>
      <TabPanel value={value} index={0}>
        <VirtualControlsForm />
      </TabPanel>
      <TabPanel value={value} index={1}>
        <KeyBindingsForm />
      </TabPanel>
    </>
  );
};

export const ControlsModal = () => {
  const { setIsModalOpen } = useContext(ModalContext);
  const [formId, setFormId] = useState<string | null>(null);

  return (
    <>
      <ModalHeader title="Controls" />
      <ModalBody>
        <ControlTabs setFormId={setFormId} />
      </ModalBody>
      <ModalFooter>
        <Button form={formId ?? ''} type="submit" variant="contained">
          Save Changes
        </Button>
        <Button variant="outlined" onClick={() => setIsModalOpen(false)}>
          Close
        </Button>
      </ModalFooter>
    </>
  );
};
