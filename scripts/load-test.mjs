// Runs against a local server only; never load-tests the public production host.
import { writeFile } from 'node:fs/promises';
const origin = process.env.TEST_ORIGIN || 'http://127.0.0.1:8200';
if (!['127.0.0.1', 'localhost'].includes(new URL(origin).hostname))
  throw Error('Load testing is restricted to localhost.');
const durations = [];
const failures = [];
const rounds = 24,
  concurrency = 2;
for (let round = 0; round < rounds; round++) {
  await Promise.all(
    Array.from({ length: concurrency }, async () => {
      const start = performance.now();
      try {
        const response = await fetch(origin + '/api/v1/predictions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            symptoms: ['E_91', 'E_201', 'E_97'],
            location: { latitude: 12.97, longitude: 77.59 },
          }),
          signal: AbortSignal.timeout(5000),
        });
        const body = await response.json();
        if (response.status !== 200 || body.hospitals?.length !== 3)
          throw Error('Unexpected result: ' + response.status);
        durations.push(performance.now() - start);
      } catch (e) {
        failures.push(String(e));
      }
    }),
  );
  await new Promise((resolve) => setTimeout(resolve, 2500));
}
durations.sort((a, b) => a - b);
const p95 = durations[Math.ceil(durations.length * 0.95) - 1];
const result = {
  requests: rounds * concurrency,
  concurrency,
  failures: failures.length,
  p95Milliseconds: Math.round(p95 * 100) / 100,
  maxMilliseconds: Math.round(durations.at(-1) * 100) / 100,
  scope: 'Local bounded smoke load; not a production capacity/SLA measurement',
  timestamp: new Date().toISOString(),
};
console.log(JSON.stringify(result, null, 2));
await writeFile(
  'load-test-result.json',
  JSON.stringify(result, null, 2) + '\n',
);
if (failures.length || p95 > 2000) process.exitCode = 1;
