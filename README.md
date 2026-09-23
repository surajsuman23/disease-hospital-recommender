# Disease Prediction & Hospital Ranking

**[Open the standalone application](https://suraj-disease-prediction.m16labs-0951.chatgpt.site)**

A standalone full-stack portfolio project for exploring symptom classification and hospital distance ranking. The React interface calls a versioned backend API; a separate Python pipeline trains and exports the model. This repository is independent of the diabetes benchmark and CPU scheduling projects.

**Educational demo only:** the data is synthetic, condition labels are arbitrary, and all facilities are fictional. The model is not a diagnostic tool and must not guide treatment or real hospital selection. The measured model accuracy is low; this is an engineering demonstration, not a clinically validated product.

## Repository structure

```text
apps/
  frontend/          React + TypeScript interface, API client, responsive styles
  backend/src/       Hono API, inference, geographic ranking, Node/Worker adapters
packages/contracts/  Shared Zod validation schemas and TypeScript contracts
ml/
  src/disease_model/ Python training and CLI implementation
  data/              Fictional facility data
  artifacts/         Versioned model parameters and evaluation metadata
  tests/             Python validation and ranking tests
  export_model.py    Reproducible training and JSON export
scripts/             Production build tooling
tests/               API, frontend, model parity tests and fixtures
docs/                Architecture, OpenAPI, operations and model documentation
.github/             CI and dependency update configuration
Dockerfile           Non-root production Node image
compose.yaml         Local container deployment
```

## Run locally

Requires Node 20.19+ (Node 22 recommended). Python is needed only for model training or the original CLI.

```sh
npm ci
npm run dev
```

Open http://127.0.0.1:8201. The frontend development server proxies `/api` to the API on port 8200. Use **Use example**, then **Run demonstration**. Hospital ranking can be toggled independently.

For the production build:

```sh
npm run check
npm start
```

Open http://127.0.0.1:8200. The Node server serves both the built frontend and API under one origin. The API itself is isolated under `apps/backend/` and can also run as a Cloudflare Worker. See [deployment and operations](docs/DEPLOYMENT.md).

Optional settings: copy `.env.example` to `.env` for the Node adapter. Never commit real environment files. No database, credentials or API keys are needed for this stateless demo.

## API

- `GET /api/health/live` — process liveness.
- `GET /api/health/ready` — model readiness and version.
- `GET /api/v1/model` — supported symptoms, evaluation and privacy details.
- `POST /api/v1/predictions` — classification and optional hospital ranking.
- `GET /api/v1/openapi.json` — machine-readable API contract.

```sh
curl http://127.0.0.1:8200/api/v1/predictions \
  -H 'Content-Type: application/json' \
  -d '{"symptoms":["fever","cough"],"location":{"latitude":12.97,"longitude":77.59}}'
```

Requests reject unknown symptoms, duplicates, invalid coordinates and unknown fields. Request bodies are limited to 4 KB. Responses include a request ID, model version and explicit demo status. Application request logs exclude payloads, symptoms, coordinates and IP addresses; no prediction records are persisted. Hosting-provider access logs are outside this application's control.

## Model pipeline

```sh
python3 -m venv .venv
source .venv/bin/activate
pip install -r ml/requirements-lock.txt
PYTHONPATH=ml/src python -m unittest discover -s ml/tests -v
python ml/export_model.py
npm test
```

The original KNN/BernoulliNB comparison selects a model using training cross-validation. A deterministic JSON artifact exports the selected BernoulliNB parameters. The backend performs the same log-probability calculation and is tested against scikit-learn on all 256 binary symptom patterns. Retraining is an explicit build operation; the public API never trains on visitor inputs.

The CLI is retained:

```sh
PYTHONPATH=ml/src python -m disease_model.core \
  --symptoms fever,cough --latitude 12.97 --longitude 77.59 --output reports
```

See the [model card](docs/MODEL_CARD.md) for data provenance, measured scores and limitations, and [SOURCES.md](SOURCES.md) for references.

## Validation and readiness

`npm run check` type-checks, runs the API/frontend/parity tests and creates production bundles. GitHub Actions checks application and Python model changes. `npm run format:check` checks formatting.

This is deployable portfolio software, not a claim of “90% production ready.” [The readiness checklist](docs/PRODUCTION_READINESS.md) distinguishes implemented safeguards, verified checks and remaining launch gates. Clinical validation, independent security review, distributed abuse controls, sustained load testing and operational ownership are not implied by a successful build.
