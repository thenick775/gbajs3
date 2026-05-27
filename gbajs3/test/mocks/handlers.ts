import jwt from 'jsonwebtoken';
import { HttpResponse, delay, http } from 'msw';

export const gbaServerLocationPlaceholder = 'https://server_location.test';
export const testRomLocation = 'https://rom_location.test';
export const googleDriveApiLocation =
  'https://www.googleapis.com/drive/v3/files';
export const googleDriveUploadApiLocation =
  'https://www.googleapis.com/upload/drive/v3/files';
export const testGoogleDriveBackup = {
  id: 'backup-1',
  name: '2025-01-02T03-04-05Z.zip',
  size: '2048'
};
export const testGoogleDriveBackup2 = {
  id: 'backup-2',
  name: '2025-01-03T03-04-05Z.zip',
  size: '1024'
};
export const invalidGoogleDriveBackupName = 'invalid-backup.zip';
export const googleDriveErrorAccessToken = 'test-google-error-token';

const generateMockJwt = () =>
  jwt.sign({}, 'test-fake-key', { expiresIn: '1s' });

export const handlers = [
  http.post(`${gbaServerLocationPlaceholder}/api/tokens/refresh`, () => {
    return new HttpResponse(null, { status: 401 });
  }),

  http.post(`${gbaServerLocationPlaceholder}/api/account/logout`, () => {
    return new HttpResponse(null, { status: 200 });
  }),

  http.get(`${gbaServerLocationPlaceholder}/api/rom/list`, () => {
    return HttpResponse.json(['rom1.gba', 'rom2.gba'], { status: 200 });
  }),

  http.get(
    `${gbaServerLocationPlaceholder}/api/rom/download`,
    async ({ request }) => {
      const url = new URL(request.url);
      const romName = url.searchParams.get('rom');

      if (romName) {
        await delay(100);

        return new HttpResponse(`test ${romName} rom`, {
          headers: {
            'Content-Type': 'application/x-gba-rom'
          }
        });
      } else {
        return new HttpResponse(null, { status: 400 });
      }
    }
  ),

  http.get(`${gbaServerLocationPlaceholder}/api/save/list`, () => {
    return HttpResponse.json(['save1.sav', 'save2.sav'], { status: 200 });
  }),

  http.get(
    `${gbaServerLocationPlaceholder}/api/save/download`,
    async ({ request }) => {
      const url = new URL(request.url);
      const saveName = url.searchParams.get('save');

      if (saveName) {
        await delay(100);

        return new HttpResponse(`test ${saveName} save`, {
          headers: {
            'Content-Type': 'application/octet-stream'
          }
        });
      } else {
        return new HttpResponse(null, { status: 400 });
      }
    }
  ),

  http.post(
    `${gbaServerLocationPlaceholder}/api/account/login`,
    async ({ request }) => {
      const data = (await request.json()) as {
        username?: string;
        password?: string;
      };
      const isValidUser =
        data.username?.startsWith('valid') &&
        data.password?.startsWith('valid');

      await delay(100);

      if (isValidUser) {
        return HttpResponse.json(generateMockJwt(), {
          status: 200
        });
      } else {
        return new HttpResponse(null, { status: 401 });
      }
    }
  ),

  http.post(
    `${gbaServerLocationPlaceholder}/api/rom/upload`,
    async ({ request }) => {
      const formData = await request.formData();
      const rom = formData.get('rom') as File;
      const romName = rom.name;

      await delay(100);

      return new HttpResponse(null, { status: romName === '400' ? 400 : 200 });
    }
  ),

  http.post(
    `${gbaServerLocationPlaceholder}/api/save/upload`,
    async ({ request }) => {
      const formData = await request.formData();
      const save = formData.get('save') as File;
      const saveName = save.name;

      await delay(100);

      return new HttpResponse(null, { status: saveName === '400' ? 400 : 200 });
    }
  ),

  http.get(googleDriveApiLocation, ({ request }) => {
    const url = new URL(request.url);

    if (
      request.headers.get('authorization') ===
      `Bearer ${googleDriveErrorAccessToken}`
    )
      return HttpResponse.json(
        {
          error: {
            message: 'Invalid Credentials',
            errors: [{ reason: 'authError' }]
          }
        },
        { status: 401 }
      );

    if (
      url.searchParams.get('spaces') !== 'appDataFolder' ||
      url.searchParams.get('fields') !== 'files(id,name,size)' ||
      url.searchParams.get('pageSize') !== '100'
    )
      return new HttpResponse(null, { status: 400 });

    return HttpResponse.json({
      files: [testGoogleDriveBackup, testGoogleDriveBackup2]
    });
  }),

  http.get(`${googleDriveApiLocation}/:backupId`, ({ request }) => {
    const url = new URL(request.url);

    if (url.searchParams.get('alt') !== 'media')
      return new HttpResponse(null, { status: 400 });

    return new HttpResponse('zip-bytes', {
      headers: { 'Content-Type': 'application/zip' }
    });
  }),

  http.post(googleDriveUploadApiLocation, async ({ request }) => {
    const url = new URL(request.url);
    const body = await request.text();

    if (
      url.searchParams.get('uploadType') !== 'multipart' ||
      url.searchParams.get('fields') !== 'id,name,size' ||
      !request.headers.get('content-type')?.includes('multipart/related') ||
      !body.includes('"parents":["appDataFolder"]') ||
      !body.includes('"mimeType":"application/zip"')
    )
      return new HttpResponse(null, { status: 400 });

    if (body.includes(`"name":"${invalidGoogleDriveBackupName}"`))
      return HttpResponse.json({
        id: 'invalid-backup',
        name: 'notes.txt',
        size: '2048'
      });

    return HttpResponse.json(testGoogleDriveBackup);
  }),

  http.delete(`${googleDriveApiLocation}/:backupId`, () => {
    return new HttpResponse(null, { status: 204 });
  }),

  http.get(`${testRomLocation}/good_rom.gba`, async () => {
    await delay(100);

    return new HttpResponse(`test external rom`, {
      headers: {
        'Content-Type': 'application/octet-stream'
      }
    });
  }),

  http.get(`${testRomLocation}/good_rom_2.gb`, async () => {
    await delay(100);

    return new HttpResponse(`test external rom 2`, {
      headers: {
        'Content-Type': 'application/octet-stream'
      }
    });
  }),

  http.get(`${testRomLocation}/bad_rom.gba`, async () => {
    await delay(100);

    return new HttpResponse(null, { status: 400 });
  })
];
