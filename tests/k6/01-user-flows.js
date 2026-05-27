import { group, sleep } from 'k6';

import { getEndpoint } from './lib/api.js';
import { endpoints, THINK_TIME_SECONDS } from './lib/config.js';

export const options = {
  scenarios: {
    user_flows: {
      executor: 'per-vu-iterations',
      vus: Number(__ENV.VUS || '3'),
      iterations: Number(__ENV.ITERATIONS || '3'),
      maxDuration: __ENV.MAX_DURATION || '2m',
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<800', 'p(99)<1500'],
  },
};

export default function () {
  group('Logowanie i kontekst uzytkownika', () => {
    getEndpoint(endpoints.me);
    getEndpoint(endpoints.dashboard);
  });

  sleep(THINK_TIME_SECONDS);

  group('Przeglad zasobow i dostepnosci', () => {
    getEndpoint(endpoints.floorPlans);
    getEndpoint(endpoints.deskAvailability);
    getEndpoint(endpoints.roomAvailability);
    getEndpoint(endpoints.equipment);
  });

  sleep(THINK_TIME_SECONDS);

  group('Historia rezerwacji uzytkownika', () => {
    getEndpoint(endpoints.reservations);
  });
}
