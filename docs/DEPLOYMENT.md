# Deployment and operations

## Node hosting

Run `npm ci`, `npm run check`, then `npm start` from the repository root. The default listener is `127.0.0.1:8200`. Set `HOST=0.0.0.0` only when intentionally exposing it behind an HTTPS reverse proxy. The reverse proxy should impose request/body timeouts and distributed rate limits. Set `LOG_REQUESTS=true` for structured metadata-only application request logs.

## Container

`docker compose up --build -d` exposes the app on localhost port 8200. The multi-stage image runs as the unprivileged `node` user, and Compose drops Linux capabilities and uses a read-only root filesystem. The health check uses `/api/health/ready`. The Docker recipe is supplied but was not built in this workspace because Docker is unavailable; validate the image in your deployment environment before relying on it.

## Worker hosting

`npm run build` emits `dist/server/index.js` with a default `fetch` export and static files in `dist/client`. The hosted runtime must provide an `ASSETS` fetch binding for the frontend. The Sites manifest in `.openai/hosting.json` identifies this independent disease project. Keep the model artifact and frontend/API bundles from the same reviewed commit.

The public release is deployed through Sites. GitHub Actions runs verification; it does **not** automatically deploy or hold hosting credentials. Deploying a later commit is a separate release step.

## Operational checks

1. Verify `/api/health/live` and `/api/health/ready` return 200.
2. Verify `/api/v1/model` reports the intended model version and `demoOnly: true`.
3. Submit the example request from the README and inspect the response contract.
4. Check API error rate, latency and request volume using provider metrics.
5. Roll back to the previous saved hosting version if health or contract checks fail.

Application logging intentionally excludes symptoms, coordinates, request bodies, IPs and URL query strings. Do not enable reverse-proxy body logging. Configure provider retention and access policies separately. No prediction database exists, so the demo has no user-record backup or deletion workflow.

The built-in 120-request/minute guard is an in-memory, per-process/isolate budget shared across clients. It resets on restart and is **not** a distributed anti-abuse system. Configure provider-level controls before a broader or high-traffic launch.
