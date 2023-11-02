import { Button, Tabs, Tab } from '@mui/material';
import { useContext, useEffect, useState, type ReactNode, useId } from 'react';
import { styled } from 'styled-components';

import { KeyBindingsForm } from './controls/key-bindings-form.tsx';
import { VirtualControlsForm } from './controls/virtual-controls-form.tsx';
import { ModalBody } from './modal-body.tsx';
import { ModalFooter } from './modal-footer.tsx';
import { ModalHeader } from './modal-header.tsx';
import { EmulatorContext } from '../../context/emulator/emulator.tsx';
import { ModalContext } from '../../context/modal/modal.tsx';

type TabPanelProps = {
  children: ReactNode;
  index: number;
  value: number;
};

type ControlTabsProps = {
  setFormId: React.Dispatch<React.SetStateAction<string | null>>;
  virtualControlsFormId: string;
  keyBindingsFormId: string;
};

const TabsWithBorder = styled(Tabs)`
  border-bottom: 1px solid;
  border-color: rgba(0, 0, 0, 0.12);
`;

const TabWrapper = styled.div`
  padding: 24px;
`;

const a11yProps = (index: number) => {
  return {
    id: `control-tab-${index}`,
    'aria-controls': `tabpanel-${index}`
  };
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

const ControlTabs = ({
  setFormId,
  virtualControlsFormId,
  keyBindingsFormId
}: ControlTabsProps) => {
  const [value, setValue] = useState(0);

  const handleChange = (_: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  useEffect(() => {
    if (value === 0) {
      setFormId(virtualControlsFormId);
    } else if (value === 1) {
      setFormId(keyBindingsFormId);
    }
  }, [value, setFormId, keyBindingsFormId, virtualControlsFormId]);

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
        <VirtualControlsForm id={virtualControlsFormId} />
      </TabPanel>
      <TabPanel value={value} index={1}>
        <KeyBindingsForm id={keyBindingsFormId} />
      </TabPanel>
    </>
  );
};

export const ControlsModal = () => {
  const { setIsModalOpen } = useContext(ModalContext);
  const { isEmulatorRunning } = useContext(EmulatorContext);
  const virtualControlsFormId = useId();
  const keyBindingsFormId = useId();
  const [formId, setFormId] = useState<string | null>(null);

  return (
    <>
      <ModalHeader title="Controls" />
      <ModalBody>
        <ControlTabs
          setFormId={setFormId}
          virtualControlsFormId={virtualControlsFormId}
          keyBindingsFormId={keyBindingsFormId}
        />
      </ModalBody>
      <ModalFooter>
        <Button
          form={formId ?? ''}
          disabled={!isEmulatorRunning && formId === keyBindingsFormId}
          type="submit"
          variant="contained"
        >
          Save Changes
        </Button>
        <Button variant="outlined" onClick={() => setIsModalOpen(false)}>
          Close
        </Button>
      </ModalFooter>
    </>
  );
};
