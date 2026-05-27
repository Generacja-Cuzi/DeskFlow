import { sleep } from 'k6';

import { getEndpoint } from './lib/api.js';
import { endpoints, THINK_TIME_SECONDS } from './lib/config.js';

const loadEndpoints = [
  endpoints.dashboard,
  endpoints.floorPlans,
  endpoints.deskAvailability,
  endpoints.equipment,
  endpoints.reservations,
];

export const options = {
  scenarios: {
    load_test: {
      executor: 'ramping-vus',
      stages: [
        { duration: __ENV.RAMP_UP || '30s', target: Number(__ENV.LOW_LOAD_VUS || '10') },
        { duration: __ENV.STEADY_LOW || '1m', target: Number(__ENV.LOW_LOAD_VUS || '10') },
        { duration: __ENV.RAMP_MID || '30s', target: Number(__ENV.MID_LOAD_VUS || '50') },
        { duration: __ENV.STEADY_MID || '1m', target: Number(__ENV.MID_LOAD_VUS || '50') },
        { duration: __ENV.RAMP_HIGH || '30s', target: Number(__ENV.HIGH_LOAD_VUS || '100') },
        { duration: __ENV.STEADY_HIGH || '1m', target: Number(__ENV.HIGH_LOAD_VUS || '100') },
        { duration: __ENV.RAMP_DOWN || '30s', target: 0 },
      ],
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.02'],
    http_req_duration: ['p(95)<1000', 'p(99)<2000'],
  },
};

export default function () {
  const endpoint = loadEndpoints[__ITER % loadEndpoints.length];
  getEndpoint(endpoint);
  sleep(THINK_TIME_SECONDS);
}
