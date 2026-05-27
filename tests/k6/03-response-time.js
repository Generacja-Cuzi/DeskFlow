import { getEndpoint } from './lib/api.js';
import { endpoints } from './lib/config.js';

const measuredEndpoints = [
  endpoints.dashboard,
  endpoints.deskAvailability,
  endpoints.equipment,
  endpoints.reservations,
];

export const options = {
  scenarios: {
    response_time_probe: {
      executor: 'shared-iterations',
      vus: Number(__ENV.VUS || '1'),
      iterations: Number(__ENV.ITERATIONS || '25'),
      maxDuration: __ENV.MAX_DURATION || '1m',
    },
  },
  thresholds: {
    'http_req_duration{name:Dashboard overview}': ['p(95)<500'],
    'http_req_duration{name:Desk availability}': ['p(95)<450'],
    'http_req_duration{name:Equipment list}': ['p(95)<500'],
    'http_req_duration{name:Reservations mine}': ['p(95)<500'],
    http_req_failed: ['rate<0.01'],
  },
};

export default function () {
  const endpoint = measuredEndpoints[__ITER % measuredEndpoints.length];
  getEndpoint(endpoint);
}
