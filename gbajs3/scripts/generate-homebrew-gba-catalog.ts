import { execFile } from 'node:child_process';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { promisify } from 'node:util';

import { z } from 'zod';

const ManifestSchema = z.object({
  platform: z.string().optional(),
  slug: z.string().optional(),
  title: z.string().optional(),
  developer: z
    .union([
      z.string(),
      z.object({ name: z.string() }),
      z.array(z.union([z.string(), z.object({ name: z.string() })]))
    ])
    .optional(),
  description: z.string().optional(),
  tags: z.array(z.string()).optional(),
  license: z.string().optional(),
  gameLicense: z.string().optional(),
  website: z
    .union([z.string(), z.object({ url: z.string() }), z.array(z.string())])
    .optional(),
  gameWebsite: z.string().optional(),
  screenshots: z.array(z.string()).optional(),
  files: z
    .array(z.object({ filename: z.string(), playable: z.boolean().optional() }))
    .optional()
});

type CatalogEntry = {
  slug: string;
  title: string;
  platform: string;
  developer?: string;
  description?: string;
  tags?: string[];
  license?: string;
  website?: string;
  cover?: { url: string };
  rom: { url: string };
};

const run = promisify(execFile);
const supportedPlatforms = ['GB', 'GBC', 'GBA'];
const supportedRomExtensions = ['.gba', '.gbc', '.gb', '.zip', '.7z'];
const sources = [
  {
    id: 'gb',
    cloneUrl: 'https://github.com/gbdev/database.git',
    rawUrl: 'https://raw.githubusercontent.com/gbdev/database/master'
  },
  {
    id: 'gba',
    cloneUrl: 'https://github.com/gbadev-org/games.git',
    rawUrl: 'https://raw.githubusercontent.com/gbadev-org/games/master'
  }
];
const encodePath = (path: string) =>
  path.split('/').map(encodeURIComponent).join('/');

const developerName = (
  developer: z.infer<typeof ManifestSchema>['developer']
) => {
  if (Array.isArray(developer))
    return developer
      .map((value) => (typeof value === 'string' ? value : value.name))
      .join(', ');

  return typeof developer === 'string' ? developer : developer?.name;
};

const websiteUrl = (website: z.infer<typeof ManifestSchema>['website']) => {
  if (Array.isArray(website)) return website[0];

  return typeof website === 'string' ? website : website?.url;
};

export const generateHomebrewCatalog = async (
  outputFile = 'public/homebrew/gba.json'
) => {
  const sourceDir = await mkdtemp(join(tmpdir(), 'gbadev-games-'));

  try {
    const entries: CatalogEntry[] = [];

    for (const source of sources) {
      const repositoryDir = join(sourceDir, source.id);
      await run('git', [
        'clone',
        '--depth',
        '1',
        '--filter=blob:none',
        '--sparse',
        source.cloneUrl,
        repositoryDir
      ]);
      await run('git', [
        '-C',
        repositoryDir,
        'sparse-checkout',
        'set',
        '--no-cone',
        'entries/*/game.json'
      ]);

      const { stdout } = await run('git', [
        '-C',
        repositoryDir,
        'ls-tree',
        '-r',
        '--name-only',
        'HEAD',
        'entries'
      ]);
      const files = stdout.trim().split('\n');
      const manifestPaths = files.filter((path) =>
        /^entries\/[^/]+\/game\.json$/.test(path)
      );

      for (const manifestPath of manifestPaths) {
        const entryPath = dirname(manifestPath);
        const entryName = entryPath.split('/')[1];
        const manifest = ManifestSchema.parse(
          JSON.parse(await readFile(join(repositoryDir, manifestPath), 'utf8'))
        );
        const rom = manifest.files?.find(
          (file) =>
            file.playable &&
            supportedRomExtensions.some((extension) =>
              file.filename.toLowerCase().endsWith(extension)
            )
        );
        if (!supportedPlatforms.includes(manifest.platform ?? '') || !rom)
          continue;

        const cover =
          files
            .find(
              (file) =>
                file.startsWith(`${entryPath}/`) &&
                /^cover\.(gif|jpe?g|png|webp)$/i.test(
                  file.slice(entryPath.length + 1)
                )
            )
            ?.slice(entryPath.length + 1) ?? manifest.screenshots?.[0];
        const entryUrl = `${source.rawUrl}/${encodePath(entryPath)}`;

        entries.push({
          slug: `${source.id}-${manifest.slug ?? entryName}`,
          title: manifest.title ?? entryName,
          platform: manifest.platform ?? '',
          developer: developerName(manifest.developer),
          description: manifest.description,
          tags: manifest.tags,
          license: manifest.gameLicense ?? manifest.license,
          website: websiteUrl(manifest.website) ?? manifest.gameWebsite,
          cover: cover
            ? { url: `${entryUrl}/${encodePath(cover)}` }
            : undefined,
          rom: { url: `${entryUrl}/${encodePath(rom.filename)}` }
        });
      }
    }

    entries.sort((a, b) => a.title.localeCompare(b.title));
    await mkdir(dirname(outputFile), { recursive: true });
    await writeFile(outputFile, JSON.stringify({ entries }) + '\n');
    console.log(`Generated ${entries.length} GBA homebrew entries`);
  } finally {
    await rm(sourceDir, { force: true, recursive: true });
  }
};

if (import.meta.main) await generateHomebrewCatalog();
