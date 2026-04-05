import { fireEvent, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import * as toast from 'react-hot-toast';
import { describe, expect, it, vi } from 'vitest';

import { NavigationMenuWidth } from './consts.tsx';
import { NavigationMenu } from './navigation-menu.tsx';
import { renderWithContext } from '../../../test/render-with-context.tsx';
import { GbaDarkTheme } from '../../context/theme/theme.tsx';
import * as contextHooks from '../../hooks/context.tsx';
import * as quickReloadHooks from '../../hooks/emulator/use-quick-reload.tsx';
import * as logoutHooks from '../../hooks/use-logout.tsx';

import type { GBAEmulator } from '../../emulator/mgba/mgba-emulator.tsx';
import type {
  UseMutateFunction,
  UseMutationResult
} from '@tanstack/react-query';

describe('<NavigationMenu />', () => {
  it('renders menu button and closed menu by default on mobile', () => {
    renderWithContext(<NavigationMenu />);

    expect(screen.getByRole('list', { name: 'Menu' })).toBeInTheDocument();
    expect(screen.getByLabelText('Menu Toggle')).toBeInTheDocument();
    expect(screen.queryByLabelText('Menu Dismiss')).not.toBeVisible();
    // renders default mounted menu items
    expect(screen.getAllByRole('listitem')).toHaveLength(13);
    expect(screen.getByTestId('menu-wrapper')).toHaveStyle({
      left: '-255px'
    });
  });

  it('renders menu button and open menu by default on desktop', () => {
    vi.spyOn(window, 'matchMedia').mockImplementation((query) => ({
      matches: query === GbaDarkTheme.isLargerThanPhone,
      media: '',
      addListener: () => {
        /* empty */
      },
      removeListener: () => {
        /* empty */
      },
      onchange: () => {
        /* empty */
      },
      addEventListener: () => {
        /* empty */
      },
      removeEventListener: () => {
        /* empty */
      },
      dispatchEvent: () => true
    }));

    renderWithContext(<NavigationMenu />);

    expect(screen.getByRole('list', { name: 'Menu' })).toBeInTheDocument();
    expect(screen.getByLabelText('Menu Toggle')).toBeInTheDocument();
    expect(screen.queryByLabelText('Menu Dismiss')).not.toBeVisible();
    // renders default mounted menu items
    expect(screen.getAllByRole('listitem')).toHaveLength(13);
    expect(screen.getByTestId('menu-wrapper')).toHaveStyle({
      left: 0
    });
  });

  it('renders menu and dismiss buttons when opened', async () => {
    renderWithContext(<NavigationMenu />);

    await userEvent.click(screen.getByLabelText('Menu Toggle'));

    expect(screen.getByRole('list', { name: 'Menu' })).toBeInTheDocument();
    expect(screen.getByLabelText('Menu Toggle')).toBeInTheDocument();
    expect(screen.getByLabelText('Menu Dismiss')).toBeVisible();
    // renders default mounted menu items
    expect(screen.getAllByRole('listitem')).toHaveLength(13);
  });

  it('toggles menu with button', async () => {
    renderWithContext(<NavigationMenu />);

    expect(screen.getByTestId('menu-wrapper')).toHaveStyle(
      `left: -${NavigationMenuWidth + 5}px`
    );
    expect(screen.getByLabelText('Menu Toggle')).toHaveStyle('left: -5px');
    expect(screen.queryByLabelText('Menu Dismiss')).not.toBeVisible();

    await userEvent.click(screen.getByLabelText('Menu Toggle'));

    expect(screen.getByTestId('menu-wrapper')).toHaveStyle(`left: 0`);
    expect(screen.getByLabelText('Menu Toggle')).toHaveStyle(
      `left: ${NavigationMenuWidth - 50}px`
    );
    expect(screen.getByLabelText('Menu Dismiss')).toBeVisible();
  });

  it('dismisses menu with overlay', async () => {
    renderWithContext(<NavigationMenu />);

    await userEvent.click(screen.getByLabelText('Menu Toggle'));

    expect(screen.getByTestId('menu-wrapper')).toHaveStyle(`left: 0`);
    expect(screen.getByLabelText('Menu Toggle')).toHaveStyle(
      `left: ${NavigationMenuWidth - 50}px`
    );
    expect(screen.getByLabelText('Menu Dismiss')).toBeInTheDocument();

    await userEvent.click(screen.getByLabelText('Menu Dismiss'));

    expect(screen.getByTestId('menu-wrapper')).toHaveStyle(
      `left: -${NavigationMenuWidth + 5}px`
    );
    expect(screen.getByLabelText('Menu Toggle')).toHaveStyle('left: -5px');
    expect(screen.queryByLabelText('Menu Dismiss')).not.toBeVisible();
  });

  describe('menu nodes', () => {
    it.each([
      ['About', { type: 'about' }],
      ['Controls', { type: 'controls' }],
      ['Emulator Settings', { type: 'emulatorSettings' }],
      ['Legal', { type: 'legal' }],
      ['Login', { type: 'login' }]
    ])('%s opens modal on click', async (title, expected) => {
      const openModalSpy = vi.fn();
      const { useModalContext: original } = await vi.importActual<
        typeof contextHooks
      >('../../hooks/context.tsx');

      vi.spyOn(contextHooks, 'useModalContext').mockImplementation(() => ({
        ...original(),
        openModal: openModalSpy
      }));

      renderWithContext(<NavigationMenu />);

      const menuNode = screen.getByText(title);

      expect(menuNode).toBeInTheDocument();

      await userEvent.click(menuNode);

      expect(openModalSpy).toHaveBeenCalledWith(expected);
    });

    it.each([
      ['Upload Files', { type: 'uploadFiles' }],
      ['File System', { type: 'fileSystem' }],
      ['Import/Export', { type: 'importExport' }]
    ])(
      '%s opens modal on click when emulator is ready',
      async (title, expected) => {
        const openModalSpy = vi.fn();
        const {
          useModalContext: originalModal,
          useEmulatorContext: originalEmulator
        } = await vi.importActual<typeof contextHooks>(
          '../../hooks/context.tsx'
        );

        vi.spyOn(contextHooks, 'useModalContext').mockImplementation(() => ({
          ...originalModal(),
          openModal: openModalSpy
        }));

        vi.spyOn(contextHooks, 'useEmulatorContext').mockImplementation(() => ({
          ...originalEmulator(),
          emulator: {
            getCurrentAutoSaveStatePath: () => null,
            getCurrentGameName: () => undefined,
            listRoms: () => ['some_rom.gba']
          } as GBAEmulator
        }));

        renderWithContext(<NavigationMenu />);

        const menuNode = screen.getByText(title);

        expect(menuNode).toBeInTheDocument();

        await userEvent.click(menuNode);

        expect(openModalSpy).toHaveBeenCalledWith(expected);
      }
    );

    it.each([
      ['Download Save', { type: 'downloadSave' }],
      ['Manage Save States', { type: 'saveStates' }],
      ['Manage Cheats', { type: 'cheats' }]
    ])(
      '%s opens modal on click with running emulator',
      async (title, expected) => {
        const openModalSpy = vi.fn();
        const {
          useModalContext: originalModal,
          useRunningContext: originalRunning
        } = await vi.importActual<typeof contextHooks>(
          '../../hooks/context.tsx'
        );

        vi.spyOn(contextHooks, 'useModalContext').mockImplementation(() => ({
          ...originalModal(),
          openModal: openModalSpy
        }));

        vi.spyOn(contextHooks, 'useRunningContext').mockImplementation(() => ({
          ...originalRunning(),
          isRunning: true
        }));

        renderWithContext(<NavigationMenu />);

        const menuNode = screen.getByText(title);

        expect(menuNode).toBeInTheDocument();

        await userEvent.click(menuNode);

        expect(openModalSpy).toHaveBeenCalledWith(expected);
      }
    );

    it('Load Local Rom opens modal on click when local roms are present', async () => {
      const openModalSpy = vi.fn();
      const { useModalContext: original } = await vi.importActual<
        typeof contextHooks
      >('../../hooks/context.tsx');
      const { useEmulatorContext: originalEmulator } = await vi.importActual<
        typeof contextHooks
      >('../../hooks/context.tsx');

      vi.spyOn(contextHooks, 'useModalContext').mockImplementation(() => ({
        ...original(),
        openModal: openModalSpy
      }));

      vi.spyOn(contextHooks, 'useEmulatorContext').mockImplementation(() => ({
        ...originalEmulator(),
        emulator: {
          getCurrentGameName: () => '/some_rom.gba',
          getCurrentAutoSaveStatePath: () => null,
          listRoms: () => ['some_rom.gba']
        } as GBAEmulator
      }));

      renderWithContext(<NavigationMenu />);

      const menuNode = screen.getByText('Load Local Rom');

      expect(menuNode).toBeInTheDocument();

      await userEvent.click(menuNode);

      expect(openModalSpy).toHaveBeenCalledWith({ type: 'loadLocalRom' });
    });

    it('Load Local Rom renders as disabled', async () => {
      const { useRunningContext: originalRunning } = await vi.importActual<
        typeof contextHooks
      >('../../hooks/context.tsx');

      vi.spyOn(contextHooks, 'useRunningContext').mockImplementation(() => ({
        ...originalRunning(),
        isRunning: false
      }));

      renderWithContext(<NavigationMenu />);

      const menuNode = screen.getByRole('button', { name: 'Load Local Rom' });

      expect(menuNode).toBeInTheDocument();
      expect(menuNode).toBeDisabled();
    });

    it.each(['Upload Files', 'File System', 'Import/Export'])(
      '%s renders as disabled while emulator is loading',
      (title) => {
        renderWithContext(<NavigationMenu />);

        expect(screen.getByRole('button', { name: title })).toBeDisabled();
      }
    );

    it('Quick Reload calls hook on click when running', async () => {
      const quickReloadSpy: () => void = vi.fn();
      const { useRunningContext: originalRunning } = await vi.importActual<
        typeof contextHooks
      >('../../hooks/context.tsx');

      vi.spyOn(contextHooks, 'useRunningContext').mockImplementation(() => ({
        ...originalRunning(),
        isRunning: true
      }));

      vi.spyOn(quickReloadHooks, 'useQuickReload').mockImplementation(() => ({
        quickReload: quickReloadSpy,
        isQuickReloadAvailable: true
      }));

      renderWithContext(<NavigationMenu />);

      const menuNode = screen.getByText('Quick Reload');

      expect(menuNode).toBeInTheDocument();

      await userEvent.click(menuNode);

      expect(quickReloadSpy).toHaveBeenCalledOnce();
    });

    it('Quick Reload renders as disabled', async () => {
      const { useRunningContext: originalRunning } = await vi.importActual<
        typeof contextHooks
      >('../../hooks/context.tsx');

      vi.spyOn(contextHooks, 'useRunningContext').mockImplementation(() => ({
        ...originalRunning(),
        isRunning: false
      }));

      vi.spyOn(quickReloadHooks, 'useQuickReload').mockImplementation(() => ({
        quickReload: vi.fn(),
        isQuickReloadAvailable: false
      }));

      renderWithContext(<NavigationMenu />);

      const menuNode = screen.getByRole('button', { name: 'Quick Reload' });

      expect(menuNode).toBeDisabled();
    });

    it('Screenshot calls emulator screenshot and toasts on success', async () => {
      const screenshotSpy: (fileName: string) => boolean = vi.fn(() => true);
      const {
        useEmulatorContext: originalEmulator,
        useRunningContext: originalRunning
      } = await vi.importActual<typeof contextHooks>('../../hooks/context.tsx');

      vi.spyOn(contextHooks, 'useEmulatorContext').mockImplementation(() => ({
        ...originalEmulator(),
        emulator: {
          screenshot: screenshotSpy,
          getCurrentGameName: () => '/some_rom.gba',
          getCurrentAutoSaveStatePath: () => null,
          listRoms: () => ['some_rom.gba']
        } as GBAEmulator,
        canvas: {} as HTMLCanvasElement
      }));

      vi.spyOn(contextHooks, 'useRunningContext').mockImplementation(() => ({
        ...originalRunning(),
        isRunning: true
      }));

      const toastSuccessSpy = vi.spyOn(toast.default, 'success');

      renderWithContext(<NavigationMenu />);

      const menuNode = screen.getByText('Screenshot');

      expect(menuNode).toBeInTheDocument();

      await userEvent.click(menuNode);

      expect(screenshotSpy).toHaveBeenCalledOnce();
      expect(toastSuccessSpy).toHaveBeenCalledWith(
        'Screenshot saved successfully',
        {
          id: expect.any(String)
        }
      );
    });

    it('Screenshot calls emulator screenshot and toasts on failure', async () => {
      const {
        useEmulatorContext: originalEmulator,
        useRunningContext: originalRunning
      } = await vi.importActual<typeof contextHooks>('../../hooks/context.tsx');

      vi.spyOn(contextHooks, 'useEmulatorContext').mockImplementation(() => ({
        ...originalEmulator(),
        emulator: {
          screenshot: () => false,
          getCurrentGameName: () => '/some_rom.gba',
          getCurrentAutoSaveStatePath: () => null,
          listRoms: () => ['some_rom.gba']
        } as GBAEmulator,
        canvas: {} as HTMLCanvasElement
      }));

      vi.spyOn(contextHooks, 'useRunningContext').mockImplementation(() => ({
        ...originalRunning(),
        isRunning: true
      }));

      const toastErrorSpy = vi.spyOn(toast.default, 'error');

      renderWithContext(<NavigationMenu />);

      const menuNode = screen.getByText('Screenshot');

      expect(menuNode).toBeInTheDocument();

      await userEvent.click(menuNode);

      expect(toastErrorSpy).toHaveBeenCalledWith('Screenshot has failed', {
        id: expect.any(String)
      });
    });

    it('Full Screen requests canvas full screen on click when running', async () => {
      const requestFullScreenSpy: () => Promise<void> = vi.fn(() =>
        Promise.resolve(undefined)
      );
      const {
        useEmulatorContext: originalEmulator,
        useRunningContext: originalRunning
      } = await vi.importActual<typeof contextHooks>('../../hooks/context.tsx');

      vi.spyOn(contextHooks, 'useEmulatorContext').mockImplementation(() => ({
        ...originalEmulator(),
        canvas: {
          requestFullscreen: requestFullScreenSpy
        } as HTMLCanvasElement
      }));

      vi.spyOn(contextHooks, 'useRunningContext').mockImplementation(() => ({
        ...originalRunning(),
        isRunning: true
      }));

      renderWithContext(<NavigationMenu />);

      const menuNode = screen.getByText('Full Screen');

      expect(menuNode).toBeInTheDocument();

      await userEvent.click(menuNode);

      expect(requestFullScreenSpy).toHaveBeenCalledOnce();
    });

    it('Full Screen toasts on exception', async () => {
      const requestFullScreenSpy: () => Promise<void> = vi.fn(() =>
        Promise.reject(new Error(''))
      );
      const {
        useEmulatorContext: originalEmulator,
        useRunningContext: originalRunning
      } = await vi.importActual<typeof contextHooks>('../../hooks/context.tsx');

      vi.spyOn(contextHooks, 'useEmulatorContext').mockImplementation(() => ({
        ...originalEmulator(),
        canvas: {
          requestFullscreen: requestFullScreenSpy
        } as HTMLCanvasElement
      }));

      vi.spyOn(contextHooks, 'useRunningContext').mockImplementation(() => ({
        ...originalRunning(),
        isRunning: true
      }));

      const toastErrorSpy = vi.spyOn(toast.default, 'error');

      renderWithContext(<NavigationMenu />);

      const menuNode = screen.getByText('Full Screen');

      expect(menuNode).toBeInTheDocument();

      await userEvent.click(menuNode);

      expect(toastErrorSpy).toHaveBeenCalledWith(
        'Full screen request has failed',
        {
          id: expect.any(String)
        }
      );
    });

    it('Logout fires logout request with authentication', async () => {
      const executeLogoutSpy = vi.fn();
      const { useAuthContext: originalAuth } = await vi.importActual<
        typeof contextHooks
      >('../../hooks/context.tsx');

      vi.spyOn(contextHooks, 'useAuthContext').mockImplementation(() => ({
        ...originalAuth(),
        isAuthenticated: () => true
      }));

      vi.spyOn(logoutHooks, 'useLogout').mockReturnValue({
        isPending: false,
        error: null,
        mutate: executeLogoutSpy as UseMutateFunction<void>
      } as UseMutationResult<void, Error, void>);

      renderWithContext(<NavigationMenu />);

      const menuNode = screen.getByText('Logout');

      expect(menuNode).toBeInTheDocument();

      await userEvent.click(menuNode);

      expect(executeLogoutSpy).toHaveBeenCalledOnce();
    });

    it.each([
      ['Load Save (Server)', { type: 'loadSave' }],
      ['Load Rom (Server)', { type: 'loadRom' }]
    ])(
      '%s opens modal on click with authentication',
      async (title, expected) => {
        const openModalSpy = vi.fn();
        const {
          useModalContext: originalModal,
          useAuthContext: originalAuth,
          useEmulatorContext: originalEmulator
        } = await vi.importActual<typeof contextHooks>(
          '../../hooks/context.tsx'
        );

        vi.spyOn(contextHooks, 'useModalContext').mockImplementation(() => ({
          ...originalModal(),
          openModal: openModalSpy
        }));

        vi.spyOn(contextHooks, 'useAuthContext').mockImplementation(() => ({
          ...originalAuth(),
          isAuthenticated: () => true
        }));

        vi.spyOn(contextHooks, 'useEmulatorContext').mockImplementation(() => ({
          ...originalEmulator(),
          emulator: {
            getCurrentAutoSaveStatePath: () => null,
            getCurrentGameName: () => undefined,
            listRoms: () => ['some_rom.gba']
          } as GBAEmulator
        }));

        renderWithContext(<NavigationMenu />);

        await userEvent.click(screen.getByRole('button', { name: 'Profile' }));

        const menuNode = screen.getByText(title);

        expect(menuNode).toBeInTheDocument();

        await userEvent.click(menuNode);

        expect(openModalSpy).toHaveBeenCalledWith(expected);
      }
    );

    it.each(['Load Save (Server)', 'Load Rom (Server)'])(
      '%s renders as disabled while emulator is loading',
      async (title) => {
        const { useAuthContext: originalAuth } = await vi.importActual<
          typeof contextHooks
        >('../../hooks/context.tsx');

        vi.spyOn(contextHooks, 'useAuthContext').mockImplementation(() => ({
          ...originalAuth(),
          isAuthenticated: () => true
        }));

        renderWithContext(<NavigationMenu />);

        await userEvent.click(screen.getByRole('button', { name: 'Profile' }));

        expect(screen.getByRole('button', { name: title })).toBeDisabled();
      }
    );

    it.each([
      ['Send Save to Server', { type: 'uploadSaveToServer' }],
      ['Send Rom to Server', { type: 'uploadRomToServer' }]
    ])(
      '%s opens modal on click with authentication and running emulator',
      async (title, expected) => {
        const openModalSpy = vi.fn();
        const {
          useModalContext: originalModal,
          useAuthContext: originalAuth,
          useRunningContext: originalRunning
        } = await vi.importActual<typeof contextHooks>(
          '../../hooks/context.tsx'
        );

        vi.spyOn(contextHooks, 'useModalContext').mockImplementation(() => ({
          ...originalModal(),
          openModal: openModalSpy
        }));

        vi.spyOn(contextHooks, 'useAuthContext').mockImplementation(() => ({
          ...originalAuth(),
          isAuthenticated: () => true
        }));

        vi.spyOn(contextHooks, 'useRunningContext').mockImplementation(() => ({
          ...originalRunning(),
          isRunning: true
        }));

        renderWithContext(<NavigationMenu />);

        const menuNode = screen.getByText(title);

        expect(menuNode).toBeInTheDocument();

        await userEvent.click(menuNode);

        expect(openModalSpy).toHaveBeenCalledWith(expected);
      }
    );
  });

  describe('menu button', () => {
    const initialPos = {
      clientX: 0,
      clientY: 0
    };
    const movements = [
      { clientX: 0, clientY: 220 },
      { clientX: 0, clientY: 120 }
    ];

    it('sets layout on drag', async () => {
      const setLayoutSpy = vi.fn();
      const { useLayoutContext: originalLayout, useDragContext: originalDrag } =
        await vi.importActual<typeof contextHooks>('../../hooks/context.tsx');

      vi.spyOn(contextHooks, 'useDragContext').mockImplementation(() => ({
        ...originalDrag(),
        areItemsDraggable: true
      }));

      vi.spyOn(contextHooks, 'useLayoutContext').mockImplementation(() => ({
        ...originalLayout(),
        setLayout: setLayoutSpy
      }));

      renderWithContext(<NavigationMenu />);

      fireEvent.mouseDown(screen.getByLabelText('Menu Toggle'), initialPos);
      fireEvent.mouseMove(document, movements[0]);
      fireEvent.mouseUp(document, movements[1]);

      expect(setLayoutSpy).toHaveBeenCalledOnce();
      expect(setLayoutSpy).toHaveBeenCalledWith('menuButton', {
        position: {
          x: movements[1].clientX,
          y: movements[1].clientY
        },
        standalone: true
      });
    });

    it('renders with existing layout', () => {
      localStorage.setItem(
        'componentLayoutsV2',
        `{
          "menuButton": {
            "portrait": {
              "position": { "x": 0, "y": 200 },
              "orientation": "UNKNOWN",
              "isLargerThanPhone": false
            } 
          }
        }`
      );

      renderWithContext(<NavigationMenu />);

      expect(screen.getByLabelText('Menu Toggle')).toHaveStyle({
        transform: 'translate(0px,200px)'
      });
    });
  });
});
