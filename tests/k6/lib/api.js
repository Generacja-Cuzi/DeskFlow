import { check } from 'k6';
import http from 'k6/http';

import { commonParams, expectedStatus, url } from './config.js';

export function getEndpoint(endpoint) {
  const res = http.get(url(endpoint.path), commonParams(endpoint.name));

  check(res, {
    [`${endpoint.name}: status is OK`]: (response) => expectedStatus(response.status),
    [`${endpoint.name}: response is JSON`]: (response) =>
      expectedStatus(response.status) && String(response.headers['Content-Type'] || '').includes('application/json'),
  });

  return res;
}

export function getMany(endpoints) {
  return http.batch(
    endpoints.map((endpoint) => ['GET', url(endpoint.path), null, commonParams(endpoint.name)])
  );
}

export function checkBatch(results, endpoints) {
  results.forEach((res, index) => {
    const endpoint = endpoints[index];
    check(res, {
      [`${endpoint.name}: batch status is OK`]: (response) => expectedStatus(response.status),
    });
  });
}
