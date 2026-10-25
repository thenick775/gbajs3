import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import { z } from 'zod';

const HomebrewEntrySchema = z.object({
  slug: z.string(),
  title: z.string(),
  platform: z.string(),
  developer: z.string().optional(),
  description: z.string().optional(),
  tags: z.array(z.string()).optional(),
  license: z.string().optional(),
  website: z.string().optional(),
  cover: z.object({ url: z.url() }).optional(),
  rom: z.object({ url: z.url() })
});
export type HomebrewEntry = z.infer<typeof HomebrewEntrySchema>;

const HomebrewCatalogSchema = z.object({
  entries: z.array(HomebrewEntrySchema)
});
export type HomebrewCatalog = z.infer<typeof HomebrewCatalogSchema>;

export const useHomebrewCatalog = (
  options?: Omit<UseQueryOptions<HomebrewCatalog>, 'queryKey' | 'queryFn'>
) =>
  useQuery<HomebrewCatalog>({
    queryKey: ['homebrewCatalog', 'gba'],
    queryFn: async () => {
      const url = `${import.meta.env.BASE_URL}homebrew/gba.json`;
      const res = await fetch(url);

      if (!res.ok)
        throw new Error(`Received unexpected status code: ${res.status}`);

      return HomebrewCatalogSchema.parse(await res.json());
    },
    staleTime: Infinity,
    ...options
  });
