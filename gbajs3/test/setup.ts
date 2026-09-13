import '@testing-library/jest-dom/vitest';
import { Blob, File } from 'node:buffer';

import { createSerializer } from '@emotion/jest';
import { FormData, Request, Response } from 'undici';
import { afterAll, afterEach, beforeAll, beforeEach, expect, vi } from 'vitest';

import { gbaServerLocationPlaceholder } from './mocks/handlers.ts';
import { server } from './mocks/server.ts';

Object.defineProperties(globalThis, {
  Blob: { value: Blob },
  File: { value: File },
  FormData: { value: FormData },
  Request: { value: Request },
  Response: { value: Response }
});

/* eslint-disable-next-line @typescript-eslint/no-unsafe-argument
   -- This still works with only a type mismatch, see https://github.com/emotion-js/emotion/issues/3132
*/
expect.addSnapshotSerializer(createSerializer());

beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' });
});

beforeEach(() => {
  vi.stubEnv('VITE_GBA_SERVER_LOCATION', gbaServerLocationPlaceholder);
  vi.stubEnv('VITE_GOOGLE_CLIENT_ID', 'test-google-client-id');

  HTMLElement.prototype.scrollIntoView = vi.fn();

  Object.defineProperty(window, 'BroadcastChannel', {
    configurable: true,
    writable: true,
    value: class MockBroadcastChannel {
      onmessage: ((event: MessageEvent) => void) | null = null;
      close = vi.fn();

      constructor(readonly name: string) {}
    }
  });

  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(), // Deprecated
      removeListener: vi.fn(), // Deprecated
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn()
    }))
  });

  Object.defineProperties(URL, {
    createObjectURL: { writable: true, value: vi.fn() },
    revokeObjectURL: { writable: true, value: vi.fn() }
  });
});

afterAll(() => {
  server.close();
});

afterEach(() => {
  vi.unstubAllEnvs();
  localStorage.clear();
  server.resetHandlers();
});
