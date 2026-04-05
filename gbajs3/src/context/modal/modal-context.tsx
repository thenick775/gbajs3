import { createContext } from 'react';

import type { UploadPublicExternalRomsModalProps } from '../../components/modals/upload-public-external-roms.tsx';

export type ModalType =
  | 'about'
  | 'uploadFiles'
  | 'controls'
  | 'fileSystem'
  | 'emulatorSettings'
  | 'importExport'
  | 'legal'
  | 'login'
  | 'downloadSave'
  | 'saveStates'
  | 'cheats'
  | 'loadLocalRom'
  | 'loadSave'
  | 'loadRom'
  | 'uploadSaveToServer'
  | 'uploadRomToServer'
  | 'uploadPublicExternalRoms';

type ModalPayloadMap = {
  about: undefined;
  uploadFiles: undefined;
  controls: undefined;
  fileSystem: undefined;
  emulatorSettings: undefined;
  importExport: undefined;
  legal: undefined;
  login: undefined;
  downloadSave: undefined;
  saveStates: undefined;
  cheats: undefined;
  loadLocalRom: undefined;
  loadSave: undefined;
  loadRom: undefined;
  uploadSaveToServer: undefined;
  uploadRomToServer: undefined;
  uploadPublicExternalRoms: UploadPublicExternalRomsModalProps;
};

export type ModalInput = {
  [K in ModalType]: ModalPayloadMap[K] extends undefined
    ? { type: K }
    : { type: K; props: ModalPayloadMap[K] };
}[ModalType];

export type ModalState = ModalInput | null;

type ModalContextProps = {
  modal: ModalState;
  openModal: (modal: ModalInput) => void;
  closeModal: () => void;
  clearModal: () => void;
  isModalOpen: boolean;
};

export const ModalContext = createContext<ModalContextProps | null>(null);

ModalContext.displayName = 'ModalContext';
