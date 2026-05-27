import { sleep } from 'k6';

import { getEndpoint } from './lib/api.js';
import { endpoints, THINK_TIME_SECONDS } from './lib/config.js';

const scalabilityEndpoints = [
  endpoints.dashboard,
  endpoints.floorPlans,
  endpoints.deskAvailability,
  endpoints.equipment,
  endpoints.reservations,
];

export const options = {
  scenarios: {
    users_10: {
      executor: 'constant-vus',
      exec: 'runScalabilityStep',
      vus: Number(__ENV.SCALE_1_VUS || '10'),
      duration: __ENV.SCALE_STEP_DURATION || '45s',
      tags: { scale: '10' },
    },
    users_50: {
      executor: 'constant-vus',
      exec: 'runScalabilityStep',
      vus: Number(__ENV.SCALE_2_VUS || '50'),
      duration: __ENV.SCALE_STEP_DURATION || '45s',
      startTime: __ENV.SCALE_2_START || '50s',
      tags: { scale: '50' },
    },
    users_100: {
      executor: 'constant-vus',
      exec: 'runScalabilityStep',
      vus: Number(__ENV.SCALE_3_VUS || '100'),
      duration: __ENV.SCALE_STEP_DURATION || '45s',
      startTime: __ENV.SCALE_3_START || '1m40s',
      tags: { scale: '100' },
    },
    users_200: {
      executor: 'constant-vus',
      exec: 'runScalabilityStep',
      vus: Number(__ENV.SCALE_4_VUS || '200'),
      duration: __ENV.SCALE_STEP_DURATION || '45s',
      startTime: __ENV.SCALE_4_START || '2m30s',
      tags: { scale: '200' },
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.03'],
    'http_req_duration{scale:10}': ['p(95)<700'],
    'http_req_duration{scale:50}': ['p(95)<900'],
    'http_req_duration{scale:100}': ['p(95)<1200'],
    'http_req_duration{scale:200}': ['p(95)<1800'],
  },
};

export function runScalabilityStep() {
  const endpoint = scalabilityEndpoints[__ITER % scalabilityEndpoints.length];
  getEndpoint(endpoint);
  sleep(THINK_TIME_SECONDS);
}
