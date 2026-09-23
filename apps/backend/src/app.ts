import { Hono } from 'hono';
import { predictionRequestSchema } from '../../../packages/contracts/src/index';
import { infer, metadata, rankHospitals } from './inference';
import openapi from '../../../docs/openapi.json';
import { consumeBudget, type BudgetDatabase } from './rate-limit';

export type Bindings = {
  DB?: BudgetDatabase;
  ASSETS?: { fetch(request: Request): Promise<Response> };
  LOG_REQUESTS?: string;
};
type Environment = { Bindings: Bindings; Variables: { requestId: string } };
export function createApp(
  options: {
    log?: (entry: Record<string, unknown>) => void;
    clock?: () => number;
    requestsPerMinute?: number;
  } = {},
) {
  const app = new Hono<Environment>();
  const clock = options.clock ?? Date.now;
  const maxRequests = options.requestsPerMinute ?? 120;
  let budget = maxRequests,
    refreshed = clock();
  const error = (code: string, message: string, requestId: string) => ({
    error: { code, message, requestId },
  });
  app.use('*', async (c, next) => {
    const started = clock();
    c.set('requestId', crypto.randomUUID());
    await next();
    c.header('X-Request-ID', c.get('requestId'));
    c.header('X-Content-Type-Options', 'nosniff');
    c.header('Referrer-Policy', 'no-referrer');
    c.header('X-Frame-Options', 'DENY');
    c.header('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    c.header(
      'Content-Security-Policy',
      "default-src 'self'; script-src 'self'; style-src 'self'; connect-src 'self'; img-src 'self' data:; font-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'",
    );
    if (c.req.path.startsWith('/api/')) c.header('Cache-Control', 'no-store');
    if (options.log || c.env?.LOG_REQUESTS === 'true') {
      // Never include URL query strings, IPs, body, symptoms or coordinates.
      (options.log ?? console.info)({
        event: 'request',
        route: c.req.path.startsWith('/api/') ? '/api/*' : '/web',
        method: c.req.method,
        status: c.res.status,
        durationMs: Math.max(0, clock() - started),
        requestId: c.get('requestId'),
      });
    }
  });
  app.get('/api/health/live', (c) => c.json({ status: 'ok' }));
  app.get('/api/health/ready', async (c) => {
    if (c.env?.DB) {
      try {
        await c.env.DB.prepare(
          'SELECT count FROM request_budget LIMIT 1',
        ).first();
      } catch {
        return c.json({ status: 'unavailable' }, 503);
      }
    }
    return c.json({
      status: 'ready',
      modelVersion: metadata.version,
      demoOnly: true,
      requestBudget: c.env?.DB ? 'distributed' : 'local',
    });
  });
  app.get('/api/v1/model', (c) => c.json(metadata));
  app.get('/api/v1/openapi.json', (c) => c.json(openapi));
  app.post('/api/v1/predictions', async (c) => {
    const id = c.get('requestId');
    const origin = c.req.header('Origin');
    if (origin && origin !== new URL(c.req.url).origin)
      return c.json(
        error('ORIGIN_NOT_ALLOWED', 'Use this application’s own origin.', id),
        403,
      );
    if (
      !/^application\/json(?:\s*;|$)/i.test(c.req.header('Content-Type') ?? '')
    )
      return c.json(
        error('UNSUPPORTED_MEDIA_TYPE', 'Send an application/json body.', id),
        415,
      );
    if (Number(c.req.header('Content-Length') || 0) > 4096)
      return c.json(
        error('BODY_TOO_LARGE', 'Request body exceeds 4096 bytes.', id),
        413,
      );
    if (c.env?.DB) {
      try {
        const limit = await consumeBudget(c.env.DB, clock(), maxRequests);
        if (!limit.allowed) {
          c.header('Retry-After', String(limit.retryAfter));
          return c.json(
            error(
              'RATE_LIMITED',
              'The shared request budget is temporarily exhausted. Please try again shortly.',
              id,
            ),
            429,
          );
        }
      } catch {
        return c.json(
          error(
            'SERVICE_UNAVAILABLE',
            'The request guard is unavailable. Please try again shortly.',
            id,
          ),
          503,
        );
      }
    } else {
      if (clock() - refreshed >= 60000) {
        budget = maxRequests;
        refreshed = clock();
      }
      if (budget <= 0) {
        c.header(
          'Retry-After',
          String(
            Math.max(1, Math.ceil((60000 - (clock() - refreshed)) / 1000)),
          ),
        );
        return c.json(
          error(
            'RATE_LIMITED',
            'Too many requests. Please try again shortly.',
            id,
          ),
          429,
        );
      }
      budget--;
    }
    let raw: unknown;
    const reader = c.req.raw.body?.getReader();
    if (!reader)
      return c.json(
        error('INVALID_JSON', 'A JSON request body is required.', id),
        400,
      );
    try {
      const chunks: Uint8Array[] = [];
      let size = 0;
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        size += value.byteLength;
        if (size > 4096) {
          await reader.cancel();
          return c.json(
            error('BODY_TOO_LARGE', 'Request body exceeds 4096 bytes.', id),
            413,
          );
        }
        chunks.push(value);
      }
      const bytes = new Uint8Array(size);
      let position = 0;
      for (const chunk of chunks) {
        bytes.set(chunk, position);
        position += chunk.byteLength;
      }
      raw = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
    } catch {
      return c.json(
        error('INVALID_JSON', 'The body is not valid JSON.', id),
        400,
      );
    }
    const parsed = predictionRequestSchema.safeParse(raw);
    if (!parsed.success)
      return c.json(
        {
          ...error(
            'VALIDATION_ERROR',
            'Check the selected symptoms and coordinates.',
            id,
          ),
          fields: parsed.error.issues.map((i) => ({
            path: i.path.join('.'),
            message: i.message,
          })),
        },
        422,
      );
    const input = parsed.data;
    const prediction = infer(input.symptoms);
    return c.json({
      requestId: id,
      modelVersion: metadata.version,
      demoOnly: true,
      ...prediction,
      hospitals: input.location
        ? rankHospitals(prediction.label, input.location, input.hospitalLimit)
        : [],
      rankingIncluded: !!input.location,
      selectedSymptoms: input.symptoms,
      notice: metadata.notice,
    });
  });
  app.all('/api/*', (c) =>
    c.json(error('NOT_FOUND', 'API route not found.', c.get('requestId')), 404),
  );
  app.onError((_error, c) =>
    c.json(
      error(
        'INTERNAL_ERROR',
        'The request could not be completed.',
        c.get('requestId'),
      ),
      500,
    ),
  );
  return app;
}
