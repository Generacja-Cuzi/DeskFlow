import { sleep } from 'k6';

import { getEndpoint } from './lib/api.js';
import { endpoints, THINK_TIME_SECONDS } from './lib/config.js';

const readEndpoints = [
  endpoints.dashboard,
  endpoints.floorPlans,
  endpoints.deskAvailability,
  endpoints.roomAvailability,
  endpoints.equipment,
  endpoints.reservations,
];

export const options = {
  scenarios: {
    normal_workload: {
      executor: 'constant-vus',
      vus: Number(__ENV.VUS || '10'),
      duration: __ENV.DURATION || '1m',
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<700', 'p(99)<1200'],
  },
};

export default function () {
  const endpoint = readEndpoints[__ITER % readEndpoints.length];
  getEndpoint(endpoint);
  sleep(THINK_TIME_SECONDS);
}
