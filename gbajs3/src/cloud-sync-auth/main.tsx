import {
  GoogleOAuthProvider,
  hasGrantedAllScopesGoogle,
  useGoogleLogin
} from '@react-oauth/google';
import { StrictMode, useState } from 'react';
import { createRoot } from 'react-dom/client';

import './styles.css';

const channelName = 'gbajs3-cloud-sync-auth';
const driveAppDataScope = 'https://www.googleapis.com/auth/drive.appdata';

export const CloudSyncAuthApp = () => {
  const [status, setStatus] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const params = new URLSearchParams(window.location.search);
  const state = params.get('state') ?? '';
  const channel =
    'BroadcastChannel' in window ? new BroadcastChannel(channelName) : null;

  const postAndClose = (message: Record<string, unknown>) => {
    channel?.postMessage({ ...message, state });
    channel?.close();
    window.close();
  };

  const login = useGoogleLogin({
    scope: driveAppDataScope,
    onSuccess: (response) => {
      if (!hasGrantedAllScopesGoogle(response, driveAppDataScope)) {
        postAndClose({
          type: 'error',
          error: 'Google Drive authorization did not grant app data access'
        });
        return;
      }

      postAndClose({
        type: 'success',
        accessToken: response.access_token,
        expiresIn: response.expires_in,
        scope: response.scope
      });
    },
    onError: (error) => {
      postAndClose({
        type: 'error',
        error:
          error.error_description ??
          error.error ??
          'Google Drive authorization failed'
      });
    },
    onNonOAuthError: (error) => {
      postAndClose({
        type: 'error',
        error: `Google Drive authorization failed: ${error.type}`
      });
    }
  });

  return (
    <main>
      <h1>Connect Google Drive</h1>
      <p>
        This authorizes gbajs3 to use its private app data folder in your Google
        Drive. No Drive token is saved by this page.
      </p>
      {!state && (
        <div id="status" role="status" aria-live="polite">
          Google Drive connection is missing required state.
        </div>
      )}
      {state && (
        <>
          <button
            type="button"
            disabled={isLoading}
            onClick={() => {
              setIsLoading(true);
              setStatus('Waiting for Google...');
              login();
            }}
          >
            Continue with Google Drive
          </button>
          <div id="status" role="status" aria-live="polite">
            {status}
          </div>
        </>
      )}
    </main>
  );
};

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- root element is in cloud-sync-auth.html
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID ?? ''}>
      <CloudSyncAuthApp />
    </GoogleOAuthProvider>
  </StrictMode>
);
