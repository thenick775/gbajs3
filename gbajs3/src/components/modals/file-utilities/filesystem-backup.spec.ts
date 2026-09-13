import {
  BlobReader,
  BlobWriter,
  Uint8ArrayWriter,
  Uint8ArrayReader,
  ZipWriter,
  ZipReader
} from '@zip.js/zip.js';
import { describe, expect, it, vi } from 'vitest';

import {
  createFilesystemBackupBlob,
  importZipToEmulatorFs
} from './filesystem-backup.ts';

import type {
  FileNode,
  GBAEmulator
} from '../../../emulator/mgba/mgba-emulator.tsx';

const readZipFiles = async (blob: Blob) => {
  const reader = new ZipReader(new BlobReader(blob));
  const entries = await reader.getEntries();
  const files = new Map<string, Uint8Array>();

  for (const entry of entries) {
    if (!entry.directory)
      files.set(entry.filename, await entry.getData(new Uint8ArrayWriter()));
  }

  await reader.close();
  return files;
};

describe('filesystem backup utilities', () => {
  it('creates a backup zip with emulator files and localStorage', async () => {
    localStorage.setItem('setting', 'value');

    const fileTree: FileNode = {
      path: '/data',
      isDir: true,
      nextNeighbor: {
        path: '/autosaves',
        isDir: true,
        children: [{ path: '/autosaves/game_auto.ss', isDir: false }]
      },
      children: [
        {
          path: '/data/games',
          isDir: true,
          children: [{ path: '/data/games/game.gba', isDir: false }]
        },
        {
          path: '/data/saves',
          isDir: true,
          children: [{ path: '/data/saves/empty.sav', isDir: false }]
        }
      ]
    };
    const getFileSpy: (path: string) => Uint8Array = vi.fn((path) => {
      if (path === '/data/games/game.gba') return new Uint8Array([1, 2, 3]);
      if (path === '/autosaves/game_auto.ss') return new Uint8Array([4, 5]);
      return new Uint8Array();
    });
    const listAllFilesSpy: () => FileNode = vi.fn(() => fileTree);
    const emulator = {
      listAllFiles: listAllFilesSpy,
      getFile: getFileSpy,
      getCurrentAutoSaveStatePath: () => null
    } as GBAEmulator;

    const blob = await createFilesystemBackupBlob(emulator);

    const files = await readZipFiles(blob);
    const fileNames = [...files.keys()].sort();

    expect(fileNames).toEqual([
      'autosaves/game_auto.ss',
      'data/games/game.gba',
      'local-storage.json'
    ]);

    expect(files.get('data/games/game.gba')).toEqual(new Uint8Array([1, 2, 3]));
    expect(files.get('autosaves/game_auto.ss')).toEqual(new Uint8Array([4, 5]));
    expect(new TextDecoder().decode(files.get('local-storage.json'))).toBe(
      '{"setting":"value"}'
    );

    expect(getFileSpy).toHaveBeenCalledWith('/data/games/game.gba');
    expect(getFileSpy).toHaveBeenCalledWith('/autosaves/game_auto.ss');
    expect(getFileSpy).toHaveBeenCalledWith('/data/saves/empty.sav');
  });

  it('creates a backup zip with localStorage when emulator is unavailable', async () => {
    localStorage.setItem('setting', 'value');

    const blob = await createFilesystemBackupBlob(null);

    const files = await readZipFiles(blob);

    expect([...files.keys()]).toEqual(['local-storage.json']);
  });

  it('imports files into the emulator and restores localStorage', async () => {
    localStorage.setItem('setting', 'value');
    const listAllFilesSpy: () => FileNode = vi.fn(() => ({
      path: '/data',
      isDir: true,
      children: [{ path: '/data/games/game.gba', isDir: false }]
    }));
    const getFileSpy: (path: string) => Uint8Array = vi.fn(
      () => new Uint8Array([1, 2, 3])
    );
    const emulator = {
      listAllFiles: listAllFilesSpy,
      getFile: getFileSpy,
      getCurrentAutoSaveStatePath: () => null
    } as GBAEmulator;
    const backupBlob = await createFilesystemBackupBlob(emulator);
    const backupFile = new File([backupBlob], 'backup.zip', {
      type: 'application/zip'
    });
    const writeFileToEmulator = vi.fn<(file: File) => Promise<void>>(() =>
      Promise.resolve()
    );

    localStorage.clear();

    await importZipToEmulatorFs(backupFile, writeFileToEmulator);

    expect(localStorage.getItem('setting')).toBe('value');
    expect(writeFileToEmulator).toHaveBeenCalledOnce();
    expect(writeFileToEmulator).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'game.gba',
        size: 3,
        type: ''
      })
    );
  });

  it('skips zip entries without importable files', async () => {
    const blobWriter = new BlobWriter('application/zip');
    const writer = new ZipWriter(blobWriter);
    const writeFileToEmulator = vi.fn<(file: File) => Promise<void>>(() =>
      Promise.resolve()
    );

    await writer.add('data/games/', new Uint8ArrayReader(new Uint8Array([1])));
    await writer.add('', new Uint8ArrayReader(new Uint8Array([1])));

    const backupBlob = await writer.close();
    const backupFile = new File([backupBlob], 'backup.zip', {
      type: 'application/zip'
    });

    await importZipToEmulatorFs(backupFile, writeFileToEmulator);

    expect(writeFileToEmulator).not.toHaveBeenCalled();
  });
});
