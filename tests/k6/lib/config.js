const defaultBaseUrl = 'http://localhost:3000';
const activeCompanyId = __ENV.ACTIVE_COMPANY_ID || 'company-techstart';

export const BASE_URL = (__ENV.BASE_URL || defaultBaseUrl).replace(/\/$/, '');
export const THINK_TIME_SECONDS = Number(__ENV.THINK_TIME_SECONDS || '1');

export function today() {
  return new Date().toISOString().slice(0, 10);
}

export function url(path) {
  return `${BASE_URL}${path}`;
}

export function commonParams(name) {
  const headers = {
    Accept: 'application/json',
  };

  if (activeCompanyId) {
    headers.Cookie = `activeCompanyId=${activeCompanyId}`;
  }

  return {
    headers,
    tags: { name },
  };
}

export function expectedStatus(status) {
  return status === 200;
}

export const endpoints = {
  dashboard: {
    name: 'Dashboard overview',
    path: '/api/dashboard/overview',
  },
  reservations: {
    name: 'Reservations mine',
    path: '/api/reservations?mine=1',
  },
  deskAvailability: {
    name: 'Desk availability',
    path: `/api/reservations/availability?type=desk&date=${today()}`,
  },
  roomAvailability: {
    name: 'Room availability',
    path: `/api/reservations/availability?type=room&date=${today()}`,
  },
  equipment: {
    name: 'Equipment list',
    path: '/api/equipment',
  },
  floorPlans: {
    name: 'Floor plans',
    path: '/api/floor-plans',
  },
};
