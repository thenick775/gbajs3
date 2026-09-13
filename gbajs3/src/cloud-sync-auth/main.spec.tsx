import * as googleOAuth from '@react-oauth/google';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { CloudSyncAuthApp } from './main.tsx';

import type { ReactNode } from 'react';

describe('<CloudSyncAuthApp />', () => {
  const createBroadcastChannel = () => {
    const channel = {
      close: vi.fn(),
      postMessage: vi.fn()
    };

    vi.spyOn(window, 'BroadcastChannel').mockImplementation(function (
      name: string
    ) {
      return {
        name,
        onmessage: null,
        close: channel.close,
        postMessage: channel.postMessage
      };
    });

    return channel;
  };

  const renderWithState = (testNode: ReactNode, state = 'test-state') => {
    window.history.pushState(
      {},
      '',
      state ? `/cloud-sync-auth.html?state=${state}` : '/cloud-sync-auth.html'
    );
    const closeSpy = vi.spyOn(window, 'close').mockImplementation(() => {
      /* empty */
    });

    render(testNode);

    return { closeSpy };
  };

  it('renders an error when state is missing', () => {
    vi.spyOn(googleOAuth, 'useGoogleLogin').mockReturnValue(vi.fn());
    createBroadcastChannel();

    render(<CloudSyncAuthApp />);

    expect(
      screen.getByText('Google Drive connection is missing required state.')
    ).toBeVisible();
    expect(
      screen.queryByRole('button', { name: 'Continue with Google Drive' })
    ).not.toBeInTheDocument();
  });

  it('posts a successful google drive token and closes', async () => {
    vi.spyOn(googleOAuth, 'hasGrantedAllScopesGoogle').mockReturnValue(true);
    vi.spyOn(googleOAuth, 'useGoogleLogin').mockImplementation((options) => {
      const implicitOptions =
        options as googleOAuth.UseGoogleLoginOptionsImplicitFlow;

      const login = () => {
        implicitOptions.onSuccess?.({
          access_token: 'access-token',
          expires_in: 3600,
          prompt: '',
          token_type: 'Bearer',
          scope: 'https://www.googleapis.com/auth/drive.appdata'
        });
      };

      return login;
    });

    const channel = createBroadcastChannel();
    const { closeSpy } = renderWithState(<CloudSyncAuthApp />);

    await userEvent.click(
      screen.getByRole('button', { name: 'Continue with Google Drive' })
    );

    expect(screen.getByRole('status')).toHaveTextContent(
      'Waiting for Google...'
    );

    expect(channel.postMessage).toHaveBeenCalledOnce();
    expect(channel.postMessage).toHaveBeenCalledWith({
      type: 'success',
      accessToken: 'access-token',
      expiresIn: 3600,
      scope: 'https://www.googleapis.com/auth/drive.appdata',
      state: 'test-state'
    });
    expect(channel.close).toHaveBeenCalledOnce();
    expect(closeSpy).toHaveBeenCalledOnce();
  });

  it('posts an error when Drive app data scope is missing', async () => {
    vi.spyOn(googleOAuth, 'hasGrantedAllScopesGoogle').mockReturnValue(false);
    vi.spyOn(googleOAuth, 'useGoogleLogin').mockImplementation((options) => {
      const implicitOptions =
        options as googleOAuth.UseGoogleLoginOptionsImplicitFlow;

      const login = () => {
        implicitOptions.onSuccess?.({
          access_token: 'access-token',
          expires_in: 3600,
          prompt: '',
          token_type: 'Bearer',
          scope: 'profile'
        });
      };

      return login;
    });

    const channel = createBroadcastChannel();
    renderWithState(<CloudSyncAuthApp />);

    await userEvent.click(
      screen.getByRole('button', { name: 'Continue with Google Drive' })
    );

    expect(channel.postMessage).toHaveBeenCalledWith({
      type: 'error',
      error: 'Google Drive authorization did not grant app data access',
      state: 'test-state'
    });
  });

  it('posts google oauth errors', async () => {
    vi.spyOn(googleOAuth, 'useGoogleLogin').mockImplementation((options) => {
      const login = () => {
        if (!options.onError) throw new Error('Expected onError callback');

        options.onError({
          error_description: 'Access denied'
        });
      };

      return login;
    });

    const channel = createBroadcastChannel();
    renderWithState(<CloudSyncAuthApp />);

    await userEvent.click(
      screen.getByRole('button', { name: 'Continue with Google Drive' })
    );

    expect(channel.postMessage).toHaveBeenCalledWith({
      type: 'error',
      error: 'Access denied',
      state: 'test-state'
    });
  });

  it('posts non-oauth errors', async () => {
    vi.spyOn(googleOAuth, 'useGoogleLogin').mockImplementation((options) => {
      const login = () => {
        if (!options.onNonOAuthError)
          throw new Error('Expected onNonOAuthError callback');

        options.onNonOAuthError({ type: 'popup_failed_to_open' });
      };

      return login;
    });

    const channel = createBroadcastChannel();
    renderWithState(<CloudSyncAuthApp />);

    await userEvent.click(
      screen.getByRole('button', { name: 'Continue with Google Drive' })
    );

    expect(channel.postMessage).toHaveBeenCalledWith({
      type: 'error',
      error: 'Google Drive authorization failed: popup_failed_to_open',
      state: 'test-state'
    });
  });
});
