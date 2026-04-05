import { useMediaQuery } from '@mui/material';
import { useTheme, styled } from '@mui/material/styles';
import { useId, useRef, useState } from 'react';
import Draggable from 'react-draggable';
import toast from 'react-hot-toast';
import {
  BiInfoCircle,
  BiFolderPlus,
  BiCloudUpload,
  BiUpload,
  BiGame,
  BiScreenshot,
  BiFullscreen,
  BiCloudDownload,
  BiRedo,
  BiBookmarks,
  BiEdit,
  BiJoystick,
  BiUserCheck,
  BiLogInCircle,
  BiLogOutCircle,
  BiCheckShield,
  BiConversation,
  BiMenu,
  BiFileFind,
  BiBrain,
  BiRefresh,
  BiDownload,
  BiX
} from 'react-icons/bi';
import { MdImportExport } from 'react-icons/md';

import { NavigationMenuWidth } from './consts.tsx';
import { NavComponent } from './nav-component.tsx';
import { NavLeaf } from './nav-leaf.tsx';
import {
  useEmulatorContext,
  useAuthContext,
  useModalContext,
  useRunningContext,
  useDragContext,
  useLayoutContext
} from '../../hooks/context.tsx';
import { useQuickReload } from '../../hooks/emulator/use-quick-reload.tsx';
import { useLogout } from '../../hooks/use-logout.tsx';
import { useShowLoadPublicRoms } from '../../hooks/use-show-load-public-roms.tsx';
import { ButtonBase } from '../shared/custom-button-base.tsx';

type ExpandableComponentProps = {
  $isExpanded?: boolean;
};

const NavigationMenuWrapper = styled('div')<ExpandableComponentProps>`
  display: flex;
  flex-direction: column;
  width: ${NavigationMenuWidth}px;
  height: 100dvh;
  position: fixed;
  background-color: ${({ theme }) => theme.mediumBlack};
  transition: left 0.4s ease-in-out;
  z-index: 150;
  text-align: left;
  left: 0;
  top: 0;
  touch-action: none;

  ${({ $isExpanded = false }) =>
    !$isExpanded &&
    `left: -${NavigationMenuWidth + 5}px;
  `};
`;

const StyledMenuHeader = styled('h2')`
  color: ${({ theme }) => theme.pureWhite};
  padding: 0.5rem 1rem;
  font-size: calc(1.3rem + 0.6vw);
  font-weight: 500;
  line-height: 1.2;
  margin-top: 0.5rem;
  margin-bottom: 0.5rem;

  &:hover {
    background-color: ${({ theme }) => theme.menuHighlight};
  }
`;

const MenuItemWrapper = styled('ul')`
  margin-bottom: 0;
  margin-top: 0;
  list-style: none;
  padding: 0;
  overflow-y: auto;
  overscroll-behavior: none;
  touch-action: pan-y;

  &::-webkit-scrollbar {
    display: none;
  }
`;

const HamburgerButton = styled(ButtonBase)<
  ExpandableComponentProps & { $areItemsDraggable: boolean }
>`
  background-color: ${({ theme }) => theme.mediumBlack};
  color: ${({ theme }) => theme.pureWhite};
  z-index: 200;
  position: fixed;
  left: ${NavigationMenuWidth - 50}px;
  top: 88dvh;
  transition: 0.4s ease-in-out;
  transition-property: left;
  cursor: pointer;
  border-radius: 0.25rem;
  border: none;
  min-height: 36px;
  min-width: 40px;

  @media ${({ theme }) => theme.isLargerThanPhone} {
    top: 12px;
  }

  @media ${({ theme }) => theme.isMobileLandscape} {
    bottom: 15px;
    top: unset;
  }

  ${({ $isExpanded = false }) =>
    !$isExpanded &&
    `left: -5px;
    `}

  &:focus {
    outline: 0;
    box-shadow: 0 0 0 0.25rem ${({ theme }) => theme.menuToggleFocusRing};
  }

  ${({ $areItemsDraggable, theme }) =>
    $areItemsDraggable &&
    `
    outline-color: ${theme.gbaThemeBlue};
    outline-style: dashed;
    outline-width: 2px;
  `}
`;

const NavigationMenuClearDismiss = styled('button')<{
  $visible: boolean;
}>`
  position: fixed;
  left: 0;
  right: 0;
  top: 0;
  height: 100%;
  z-index: 140;
  border: none;
  background: ${({ theme }) => theme.menuBackdrop};
  backdrop-filter: blur(8px);

  opacity: ${({ $visible }) => ($visible ? 1 : 0)};
  pointer-events: ${({ $visible }) => ($visible ? 'auto' : 'none')};

  transition: opacity 0.4s ease-in-out;
`;

export const NavigationMenu = () => {
  const menuButtonRef = useRef<HTMLButtonElement | null>(null);
  const { openModal } = useModalContext();
  const { isAuthenticated } = useAuthContext();
  const { canvas, emulator } = useEmulatorContext();
  const { isRunning } = useRunningContext();
  const { mutate: executeLogout } = useLogout();
  const { areItemsDraggable } = useDragContext();
  const { getLayout, setLayout } = useLayoutContext();
  const menuButtonLayout = getLayout('menuButton');
  const theme = useTheme();
  const isLargerThanPhone = useMediaQuery(theme.isLargerThanPhone);
  const [isExpandedByUser, setIsExpandedByUser] = useState<boolean | null>(
    null
  );
  const isMobileLandscape = useMediaQuery(theme.isMobileLandscape);
  const menuHeaderId = useId();
  const screenshotToastId = useId();
  const fullScreenToastId = useId();
  const { quickReload, isQuickReloadAvailable } = useQuickReload();

  const isExpanded =
    isExpandedByUser ?? (isLargerThanPhone && !isMobileLandscape);
  const isEmulatorReady = !!emulator;
  const isMenuItemDisabledByAuth = !isAuthenticated();
  const hasApiLocation = !!import.meta.env.VITE_GBA_SERVER_LOCATION;
  const hasNoLocalRoms = isEmulatorReady && !emulator.listRoms().length;

  useShowLoadPublicRoms();

  return (
    <>
      <NavigationMenuWrapper
        data-testid="menu-wrapper"
        id="menu-wrapper"
        $isExpanded={isExpanded}
      >
        <Draggable
          nodeRef={menuButtonRef}
          bounds="parent"
          axis="y"
          position={menuButtonLayout?.position ?? { x: 0, y: 0 }}
          disabled={!areItemsDraggable}
          onStop={(_, data) => {
            setLayout('menuButton', {
              position: { x: 0, y: data.y },
              standalone: true
            });
          }}
        >
          <HamburgerButton
            ref={menuButtonRef}
            id="menu-btn"
            $isExpanded={isExpanded}
            onClick={() => {
              setIsExpandedByUser((prevState) => !prevState);
            }}
            aria-label="Menu Toggle"
            $areItemsDraggable={areItemsDraggable}
          >
            {isExpanded ? (
              <BiX
                style={{
                  height: '29px',
                  width: '29px',
                  verticalAlign: 'middle'
                }}
              />
            ) : (
              <BiMenu
                style={{
                  height: '29px',
                  width: '29px',
                  verticalAlign: 'middle'
                }}
              />
            )}
          </HamburgerButton>
        </Draggable>
        <StyledMenuHeader id={menuHeaderId}>Menu</StyledMenuHeader>
        <MenuItemWrapper aria-labelledby={menuHeaderId}>
          <NavLeaf
            title="About"
            icon={<BiInfoCircle />}
            $withPadding
            onClick={() => {
              openModal({ type: 'about' });
            }}
          />

          <NavComponent
            title="Pre Game Actions"
            $disabled={isRunning}
            $isExpanded={!isRunning}
            icon={<BiFolderPlus />}
          >
            <NavLeaf
              title="Upload Files"
              $disabled={isRunning || !isEmulatorReady}
              icon={<BiUpload />}
              onClick={() => {
                openModal({ type: 'uploadFiles' });
              }}
            />
            <NavLeaf
              title="Load Local Rom"
              $disabled={isRunning || !isEmulatorReady || hasNoLocalRoms}
              icon={<BiRedo />}
              onClick={() => {
                openModal({ type: 'loadLocalRom' });
              }}
            />
          </NavComponent>

          <NavComponent
            title="In Game Actions"
            $disabled={!isRunning}
            $isExpanded={isRunning}
            icon={<BiGame />}
          >
            <NavLeaf
              title="Screenshot"
              $disabled={!isRunning}
              icon={<BiScreenshot />}
              onClick={() => {
                if (emulator?.screenshot())
                  toast.success('Screenshot saved successfully', {
                    id: screenshotToastId
                  });
                else
                  toast.error('Screenshot has failed', {
                    id: screenshotToastId
                  });
              }}
            />
            <NavLeaf
              title="Full Screen"
              $disabled={!isRunning}
              icon={<BiFullscreen />}
              onClick={() => {
                canvas?.requestFullscreen().catch(() => {
                  toast.error('Full screen request has failed', {
                    id: fullScreenToastId
                  });
                });
              }}
            />
            <NavLeaf
              title="Download Save"
              $disabled={!isRunning}
              icon={<BiDownload />}
              onClick={() => {
                openModal({ type: 'downloadSave' });
              }}
            />
            <NavLeaf
              title="Manage Save States"
              $disabled={!isRunning}
              icon={<BiBookmarks />}
              onClick={() => {
                openModal({ type: 'saveStates' });
              }}
            />
            <NavLeaf
              title="Manage Cheats"
              $disabled={!isRunning}
              icon={<BiEdit />}
              onClick={() => {
                openModal({ type: 'cheats' });
              }}
            />
          </NavComponent>

          <NavLeaf
            title="Quick Reload"
            $disabled={!isQuickReloadAvailable}
            icon={<BiRefresh />}
            $withPadding
            onClick={quickReload}
          />

          <NavLeaf
            title="Controls"
            icon={<BiJoystick />}
            $withPadding
            onClick={() => {
              openModal({ type: 'controls' });
            }}
          />

          <NavLeaf
            title="File System"
            icon={<BiFileFind />}
            $withPadding
            $disabled={!isEmulatorReady}
            onClick={() => {
              openModal({ type: 'fileSystem' });
            }}
          />

          <NavLeaf
            title="Emulator Settings"
            icon={<BiBrain />}
            $withPadding
            onClick={() => {
              openModal({ type: 'emulatorSettings' });
            }}
          />

          <NavComponent
            title="Profile"
            icon={<BiUserCheck />}
            $disabled={!hasApiLocation}
          >
            <NavLeaf
              title="Login"
              icon={<BiLogInCircle />}
              onClick={() => {
                openModal({ type: 'login' });
              }}
            />
            <NavLeaf
              title="Logout"
              $disabled={isMenuItemDisabledByAuth}
              icon={<BiLogOutCircle />}
              onClick={executeLogout}
            />
            <NavLeaf
              title="Load Save (Server)"
              $disabled={isMenuItemDisabledByAuth || !isEmulatorReady}
              icon={<BiCloudDownload />}
              onClick={() => {
                openModal({ type: 'loadSave' });
              }}
            />
            <NavLeaf
              title="Load Rom (Server)"
              $disabled={isMenuItemDisabledByAuth || !isEmulatorReady}
              icon={<BiCloudDownload />}
              onClick={() => {
                openModal({ type: 'loadRom' });
              }}
            />
            <NavLeaf
              title="Send Save to Server"
              $disabled={isMenuItemDisabledByAuth || !isRunning}
              icon={<BiCloudUpload />}
              onClick={() => {
                openModal({ type: 'uploadSaveToServer' });
              }}
            />
            <NavLeaf
              title="Send Rom to Server"
              $disabled={isMenuItemDisabledByAuth || !isRunning}
              icon={<BiCloudUpload />}
              onClick={() => {
                openModal({ type: 'uploadRomToServer' });
              }}
            />
          </NavComponent>

          <NavLeaf
            title="Import/Export"
            icon={<MdImportExport />}
            $disabled={!isEmulatorReady}
            onClick={() => {
              openModal({ type: 'importExport' });
            }}
            $withPadding
          />

          <NavLeaf
            title="Legal"
            icon={<BiCheckShield />}
            onClick={() => {
              openModal({ type: 'legal' });
            }}
            $withPadding
          />

          <NavLeaf
            title="Contact"
            icon={<BiConversation />}
            $link="https://github.com/thenick775/gbajs3"
            $withPadding
          />
        </MenuItemWrapper>
      </NavigationMenuWrapper>
      <NavigationMenuClearDismiss
        $visible={isExpanded && (!isLargerThanPhone || isMobileLandscape)}
        aria-label="Menu Dismiss"
        onClick={() => {
          setIsExpandedByUser(false);
        }}
      />
    </>
  );
};
