# Deployment and operations

## Node hosting

Run `npm ci`, `npm run check`, then `npm start` from the repository root. The default listener is `127.0.0.1:8200`. Set `HOST=0.0.0.0` only when intentionally exposing it behind an HTTPS reverse proxy. The reverse proxy should impose request/body timeouts and distributed rate limits. Set `LOG_REQUESTS=true` for structured metadata-only application request logs.

## Container

`docker compose up --build -d` exposes the app on localhost port 8200. The multi-stage image runs as the unprivileged `node` user, and Compose drops Linux capabilities and uses a read-only root filesystem. The health check uses `/api/health/ready`. The CI container job builds the image, checks readiness and the non-root runtime user, and runs the bounded local load test. Docker is unavailable in the authoring workspace; use the exact commit's CI result as verification evidence.

## Worker hosting

`npm run build` emits `dist/server/index.js` with a default `fetch` export and static files in `dist/client`. The hosted runtime must provide an `ASSETS` fetch binding for the frontend and a D1 binding named `DB`. The schema-only migration in `drizzle/` creates an aggregate request-budget table. Generate schema changes with `npm run db:generate`; never edit an applied migration. The Sites manifest in `.openai/hosting.json` identifies this independent disease project. Keep the model artifact and frontend/API bundles from the same reviewed commit.

The public release is deployed through Sites. GitHub Actions runs verification; it does **not** automatically deploy or hold hosting credentials. Deploying a later commit is a separate release step.

## Operational checks

1. Verify `/api/health/live` and `/api/health/ready` return 200.
2. Verify `/api/v1/model` reports the intended model version and `demoOnly: true`.
3. Submit the example request from the README and inspect the response contract.
4. Check API error rate, latency and request volume using provider metrics.
5. Roll back to the previous saved hosting version if health or contract checks fail.

Application logging intentionally excludes symptoms, coordinates, request bodies, IPs and URL query strings. Do not enable reverse-proxy body logging. Configure provider retention and access policies separately. No prediction database exists, so the demo has no user-record backup or deletion workflow.

The hosted Worker uses an atomic D1 upsert for an aggregate 120-request/minute budget shared across instances. It stores one fixed key, the minute window and count; no visitor identifiers or health inputs. Exhausting the global budget affects all clients. Database failures fail closed with HTTP 503. Node/container mode uses a local in-memory fallback, reported by readiness. This is a resource budget, not a per-client WAF or comprehensive denial-of-service defense. Configure provider-level controls for broader traffic.

`npm run test:load` runs 48 requests in 24 rounds against localhost only, with two concurrent requests and a 2.5-second delay per round. It checks response structure, failures and p95 below 2 seconds. This is a bounded smoke/short-soak test, not a production capacity guarantee.

The availability workflow checks readiness and model metadata twice per hour. Failed-run notifications depend on the owner's GitHub settings. GitHub schedules may be delayed or disabled for inactivity; dedicated paging, long-term SLO measurement and an operator remain deployment responsibilities.
