import { describe, expect, it } from 'vitest';
import { createApp } from '../apps/backend/src/app';
import {
  predictionResponseSchema,
  metadataSchema,
} from '../packages/contracts/src/index';
const payload = {
  symptoms: ['fever', 'cough'],
  location: { latitude: 12.97, longitude: 77.59 },
};
const call = (
  app: ReturnType<typeof createApp>,
  data: unknown,
  headers: Record<string, string> = {},
) =>
  app.request('http://localhost/api/v1/predictions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(data),
  });
describe('API contract and defensive boundaries', () => {
  it('serves model metadata, readiness and versioned predictions', async () => {
    const app = createApp();
    expect((await app.request('/api/health/ready')).status).toBe(200);
    metadataSchema.parse(await (await app.request('/api/v1/model')).json());
    const response = await call(app, payload);
    expect(response.status).toBe(200);
    const result = predictionResponseSchema.parse(await response.json());
    expect(result.demoOnly).toBe(true);
    expect(result.hospitals).toHaveLength(3);
    expect(result.hospitals[0].name).toBe('Fictional Demo Hospital A');
    expect(result.hospitals[0].distanceKm).toBe(1.553);
    expect(response.headers.get('X-Request-ID')).toBe(result.requestId);
    expect(response.headers.get('Cache-Control')).toBe('no-store');
    expect(response.headers.get('Content-Security-Policy')).toContain(
      "frame-ancestors 'none'",
    );
  });
  it('does not rank hospitals unless coordinates are supplied', async () => {
    const result = await (
      await call(createApp(), { symptoms: ['fever'] })
    ).json();
    expect(result.rankingIncluded).toBe(false);
    expect(result.hospitals).toEqual([]);
  });
  it.each([
    {},
    { symptoms: [] },
    { symptoms: ['made_up'] },
    { symptoms: ['fever', 'fever'] },
    { ...payload, location: { latitude: 91, longitude: 0 } },
    { ...payload, location: { latitude: '12', longitude: 0 } },
    { ...payload, hospitalLimit: 0 },
    { ...payload, hospitalLimit: 5 },
    { ...payload, hospitalLimit: 1.5 },
    { ...payload, patientName: 'must not be accepted' },
    {
      ...payload,
      location: { latitude: 0, longitude: 0, address: 'unexpected' },
    },
  ])('rejects invalid or extra input: %j', async (invalid) =>
    expect((await call(createApp(), invalid)).status).toBe(422),
  );
  it('rejects cross-origin, wrong media type, malformed JSON and oversized bodies', async () => {
    const app = createApp();
    expect(
      (await call(app, payload, { Origin: 'https://untrusted.example' }))
        .status,
    ).toBe(403);
    expect(
      (await call(app, payload, { 'Content-Type': 'text/plain' })).status,
    ).toBe(415);
    expect(
      (
        await app.request('/api/v1/predictions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: '{',
        })
      ).status,
    ).toBe(400);
    expect(
      (
        await app.request('/api/v1/predictions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: ' '.repeat(4097),
        })
      ).status,
    ).toBe(413);
  });
  it('limits request bursts and refills after the documented interval', async () => {
    let now = 1000;
    const app = createApp({ requestsPerMinute: 1, clock: () => now });
    expect((await call(app, payload)).status).toBe(200);
    const limited = await call(app, payload);
    expect(limited.status).toBe(429);
    expect(limited.headers.get('Retry-After')).toBe('60');
    now += 60000;
    expect((await call(app, payload)).status).toBe(200);
  });
  it('keeps request bodies and identifying fields out of application logs', async () => {
    const logs: Record<string, unknown>[] = [];
    const app = createApp({ log: (entry) => logs.push(entry) });
    await call(app, payload);
    const serialized = JSON.stringify(logs);
    expect(logs).toHaveLength(1);
    for (const value of [
      'fever',
      'cough',
      '12.97',
      '77.59',
      'symptoms',
      'location',
    ])
      expect(serialized).not.toContain(value);
  });
  it('returns JSON 404s instead of frontend HTML for unknown API routes', async () => {
    const response = await createApp().request('/api/v1/unknown');
    expect(response.status).toBe(404);
    expect((await response.json()).error.code).toBe('NOT_FOUND');
  });
});
