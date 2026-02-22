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

// MSW setup
vi.stubEnv('VITE_GBA_SERVER_LOCATION', gbaServerLocationPlaceholder);

beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' });
});

beforeEach(() => {
  HTMLElement.prototype.scrollIntoView = vi.fn();

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
  localStorage.clear();
  server.resetHandlers();
});
