import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, describe, expect, it, vi } from 'vitest';

import { generateHomebrewCatalog } from './generate-homebrew-gba-catalog';

const tempDirectories: string[] = [];

const fakeGit = `#!/usr/bin/env node
import { mkdir, writeFile } from 'node:fs/promises';
import { basename, join } from 'node:path';

const args = process.argv.slice(2);
if (args[0] === 'clone') {
  const cloneUrl = args.at(-2);
  const repositoryDir = args.at(-1);
  const source = cloneUrl.includes('gbdev') ? 'gb' : 'gba';
  const entryDir = join(repositoryDir, 'entries', 'example');
  const unsupportedEntryDir = join(repositoryDir, 'entries', 'unsupported');
  const manifest = source === 'gb'
    ? {
        platform: 'GB',
        slug: 'example-gb',
        title: 'Example GB',
        developer: [{ name: 'GB Dev' }, 'Contributor'],
        files: [
          { filename: 'roms/Example GB.gb', playable: true },
          { filename: 'readme.txt', playable: false }
        ]
      }
    : {
        platform: 'GBA',
        title: 'Example GBA',
        gameLicense: 'MIT',
        website: ['https://example.test'],
        screenshots: ['images/screenshot.png'],
        files: [{ filename: 'Example GBA.gba', playable: true }]
      };
  await mkdir(entryDir, { recursive: true });
  await writeFile(join(entryDir, 'game.json'), JSON.stringify(manifest));
  await mkdir(unsupportedEntryDir, { recursive: true });
  await writeFile(
    join(unsupportedEntryDir, 'game.json'),
    JSON.stringify({
      platform: 'NDS',
      files: [{ filename: 'Unsupported.gba', playable: true }]
    })
  );
} else if (args.includes('ls-tree')) {
  const source = basename(args[1]);
  process.stdout.write(
    source === 'gb'
      ? 'entries/example/game.json\\nentries/example/cover.png\\n'
      : 'entries/example/game.json\\nentries/unsupported/game.json\\n'
  );
}
`;

afterEach(async () => {
  await Promise.all(
    tempDirectories
      .splice(0)
      .map((directory) => rm(directory, { force: true, recursive: true }))
  );
});

describe('generate-homebrew-gba-catalog', () => {
  it('aggregates Game Boy and GBA manifests into a playable catalog', async () => {
    const tempDir = await mkdtemp(join(tmpdir(), 'homebrew-generator-test-'));
    tempDirectories.push(tempDir);
    const gitPath = join(tempDir, 'git');
    await writeFile(gitPath, fakeGit, { mode: 0o755 });
    vi.stubEnv('PATH', `${tempDir}:${process.env.PATH}`);

    const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {
      /* empty */
    });

    await generateHomebrewCatalog(join(tempDir, 'public/homebrew/gba.json'));

    expect(consoleLogSpy).toHaveBeenCalledExactlyOnceWith(
      'Generated 2 GBA homebrew entries'
    );

    const catalog = JSON.parse(
      await readFile(join(tempDir, 'public/homebrew/gba.json'), 'utf8')
    ) as { entries: Record<string, unknown>[] };

    expect(catalog.entries).toEqual([
      {
        slug: 'gb-example-gb',
        title: 'Example GB',
        platform: 'GB',
        developer: 'GB Dev, Contributor',
        cover: {
          url: 'https://raw.githubusercontent.com/gbdev/database/master/entries/example/cover.png'
        },
        rom: {
          url: 'https://raw.githubusercontent.com/gbdev/database/master/entries/example/roms/Example%20GB.gb'
        }
      },
      {
        slug: 'gba-example',
        title: 'Example GBA',
        platform: 'GBA',
        license: 'MIT',
        website: 'https://example.test',
        cover: {
          url: 'https://raw.githubusercontent.com/gbadev-org/games/master/entries/example/images/screenshot.png'
        },
        rom: {
          url: 'https://raw.githubusercontent.com/gbadev-org/games/master/entries/example/Example%20GBA.gba'
        }
      }
    ]);
  });
});
