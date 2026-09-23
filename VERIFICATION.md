# Verification — 2026-09-23

- TypeScript type checking passed.
- 23 API, frontend and inference tests passed. They include strict input rejection, malformed/oversized bodies, origin rejection, request-budget refill, safe application logging, recoverable frontend errors and stale-result clearing.
- The inference test compares labels and scores against scikit-learn for all 256 binary feature patterns, to 12 decimal places.
- Four Python tests passed for training, input validation, classification and geographic ranking.
- npm dependency audit reported zero known vulnerabilities at verification time. This is not an independent security assessment.

## Interface and operations release

[GitHub Actions run 35884286708](https://github.com/surajsuman23/disease-hospital-recommender/actions/runs/35884286708) passed application, model, browser and container jobs for application commit `485f3afe2c728604fd04cec5d4ece28b07c786f5`.

- Eight browser cases passed across Chromium, Firefox, WebKit and a mobile WebKit viewport: prediction and hospital ranking, ranking disabled, API failure/retry, responsive width and axe WCAG 2 A/AA and 2.1 AA rules.
- Docker built on the GitHub runner; readiness, unprivileged runtime user and bounded load checks passed. Docker is unavailable in the authoring workspace.
- A separate local 48-request, concurrency-two smoke/short-soak run had zero failures and 15.72 ms p95. This is not an external capacity test or an uptime guarantee.
- The SQL budget tests execute the actual atomic upsert in SQLite, check reset and delayed requests, and verify fail-closed API behavior.

Automated accessibility checks cover the tested flows, not a manual assistive-technology audit. Independent security assessment, sustained production load measurement and clinical validation remain incomplete.
