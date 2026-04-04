import {
  Suspense,
  lazy,
  type ComponentType,
  type LazyExoticComponent
} from 'react';

import {
  ModalSuspenseFallback,
  ModalContentFadeIn
} from './modal-suspense-fallback.tsx';

import type {
  ModalState,
  ModalType
} from '../../context/modal/modal-context.tsx';

type PropLessModalType = Exclude<ModalType, 'uploadPublicExternalRoms'>;

type LazyModalComponent<TProps = object> = LazyExoticComponent<
  ComponentType<TProps>
>;

type LazyNamedModal = <TModule, TProps extends object>(
  load: () => Promise<TModule>,
  pick: (module: TModule) => ComponentType<TProps>
) => LazyModalComponent<TProps>;

const lazyNamedModal: LazyNamedModal = (load, pick) =>
  lazy(async () => ({
    default: pick(await load())
  }));

const AboutModal = lazyNamedModal(
  () => import('./about.tsx'),
  (module) => module.AboutModal
);
const CheatsModal = lazyNamedModal(
  () => import('./cheats.tsx'),
  (module) => module.CheatsModal
);
const ControlsModal = lazyNamedModal(
  () => import('./controls.tsx'),
  (module) => module.ControlsModal
);
const DownloadSaveModal = lazyNamedModal(
  () => import('./download-save.tsx'),
  (module) => module.DownloadSaveModal
);
const EmulatorSettingsModal = lazyNamedModal(
  () => import('./emulator-settings.tsx'),
  (module) => module.EmulatorSettingsModal
);
const FileSystemModal = lazyNamedModal(
  () => import('./file-system.tsx'),
  (module) => module.FileSystemModal
);
const ImportExportModal = lazyNamedModal(
  () => import('./import-export.tsx'),
  (module) => module.ImportExportModal
);
const LegalModal = lazyNamedModal(
  () => import('./legal.tsx'),
  (module) => module.LegalModal
);
const LoadLocalRomModal = lazyNamedModal(
  () => import('./load-local-rom.tsx'),
  (module) => module.LoadLocalRomModal
);
const LoadRomModal = lazyNamedModal(
  () => import('./load-rom.tsx'),
  (module) => module.LoadRomModal
);
const LoadSaveModal = lazyNamedModal(
  () => import('./load-save.tsx'),
  (module) => module.LoadSaveModal
);
const LoginModal = lazyNamedModal(
  () => import('./login.tsx'),
  (module) => module.LoginModal
);
const SaveStatesModal = lazyNamedModal(
  () => import('./save-states.tsx'),
  (module) => module.SaveStatesModal
);
const UploadFilesModal = lazyNamedModal(
  () => import('./upload-files.tsx'),
  (module) => module.UploadFilesModal
);
const UploadPublicExternalRomsModal = lazyNamedModal(
  () => import('./upload-public-external-roms.tsx'),
  (module) => module.UploadPublicExternalRomsModal
);
const UploadRomToServerModal = lazyNamedModal(
  () => import('./upload-rom-to-server.tsx'),
  (module) => module.UploadRomToServerModal
);
const UploadSaveToServerModal = lazyNamedModal(
  () => import('./upload-save-to-server.tsx'),
  (module) => module.UploadSaveToServerModal
);

const propLessModalRegistry: Record<PropLessModalType, LazyModalComponent> = {
  about: AboutModal,
  uploadFiles: UploadFilesModal,
  controls: ControlsModal,
  fileSystem: FileSystemModal,
  emulatorSettings: EmulatorSettingsModal,
  importExport: ImportExportModal,
  legal: LegalModal,
  login: LoginModal,
  downloadSave: DownloadSaveModal,
  saveStates: SaveStatesModal,
  cheats: CheatsModal,
  loadLocalRom: LoadLocalRomModal,
  loadSave: LoadSaveModal,
  loadRom: LoadRomModal,
  uploadSaveToServer: UploadSaveToServerModal,
  uploadRomToServer: UploadRomToServerModal
};

const renderModalBody = (modal: Exclude<ModalState, null>) => {
  if (modal.type === 'uploadPublicExternalRoms') {
    return <UploadPublicExternalRomsModal {...modal.props} />;
  }

  const Modal = propLessModalRegistry[modal.type];

  return <Modal />;
};

export const ModalRenderer = ({ modal }: { modal: ModalState }) => {
  if (!modal) return null;

  return (
    <Suspense fallback={<ModalSuspenseFallback />}>
      <ModalContentFadeIn>{renderModalBody(modal)}</ModalContentFadeIn>
    </Suspense>
  );
};
