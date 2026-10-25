import { waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { useHomebrewCatalog } from './use-homebrew-catalog.tsx';
import {
  testHomebrewCatalog,
  testHomebrewCatalogBaseUrl,
  testHomebrewCatalogErrorBaseUrl,
  testInvalidHomebrewCatalogBaseUrl
} from '../../test/mocks/handlers.ts';
import { renderHookWithContext } from '../../test/render-hook-with-context.tsx';

describe('useHomebrewCatalog', () => {
  it('reports an HTTP failure', async () => {
    vi.stubEnv('BASE_URL', testHomebrewCatalogErrorBaseUrl);
    const { result } = renderHookWithContext(() =>
      useHomebrewCatalog({ retry: false })
    );

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error?.message).toBe(
      'Received unexpected status code: 500'
    );
  });

  it('rejects an invalid catalog response', async () => {
    vi.stubEnv('BASE_URL', testInvalidHomebrewCatalogBaseUrl);
    const { result } = renderHookWithContext(() =>
      useHomebrewCatalog({ retry: false })
    );

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toBeInstanceOf(Error);
  });

  it('loads the catalog', async () => {
    vi.stubEnv('BASE_URL', testHomebrewCatalogBaseUrl);
    const { result } = renderHookWithContext(() => useHomebrewCatalog());

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(testHomebrewCatalog);
  });
});
