import { HttpResponse, http } from 'msw';

export const gbaServerLocationPlaceholder = 'https://server_location.test';

export const handlers = [
  http.post(`${gbaServerLocationPlaceholder}/api/tokens/refresh`, () => {
    return HttpResponse.json('', { status: 401 });
  }),

  http.post(`${gbaServerLocationPlaceholder}/api/account/logout`, () => {
    return HttpResponse.json('', { status: 200 });
  })
];
