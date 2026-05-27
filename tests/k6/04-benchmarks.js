import { group } from 'k6';
import { Trend } from 'k6/metrics';

import { checkBatch, getMany } from './lib/api.js';
import { endpoints, expectedStatus } from './lib/config.js';

const dashboardBenchmark = new Trend('benchmark_dashboard_flow_duration');
const reservationBenchmark = new Trend('benchmark_reservation_flow_duration');

export const options = {
  scenarios: {
    benchmark: {
      executor: 'per-vu-iterations',
      vus: Number(__ENV.VUS || '1'),
      iterations: Number(__ENV.ITERATIONS || '20'),
      maxDuration: __ENV.MAX_DURATION || '2m',
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.01'],
    benchmark_dashboard_flow_duration: ['avg<700', 'p(95)<1200'],
    benchmark_reservation_flow_duration: ['avg<800', 'p(95)<1400'],
  },
};

function addFlowDuration(metric, responses) {
  const total = responses.reduce((sum, response) => sum + response.timings.duration, 0);
  const successful = responses.every((response) => expectedStatus(response.status));

  if (successful) {
    metric.add(total);
  }
}

export default function () {
  group('Benchmark dashboardu', () => {
    const benchmarkEndpoints = [endpoints.dashboard, endpoints.floorPlans];
    const responses = getMany(benchmarkEndpoints);
    checkBatch(responses, benchmarkEndpoints);
    addFlowDuration(dashboardBenchmark, responses);
  });

  group('Benchmark rezerwacji', () => {
    const benchmarkEndpoints = [endpoints.deskAvailability, endpoints.roomAvailability, endpoints.reservations];
    const responses = getMany(benchmarkEndpoints);
    checkBatch(responses, benchmarkEndpoints);
    addFlowDuration(reservationBenchmark, responses);
  });
}
