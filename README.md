# Arovia — Disease Research & Hospital Directory

[Open the hosted app](https://suraj-disease-prediction.m16labs-0951.chatgpt.site)

A full-stack student research application with a dashboard, searchable symptom assessment, a separate disease-candidate results screen, a Bengaluru hospital directory and an inspectable model catalogue. Built with React, TypeScript, Hono and an offline Python training pipeline.

## What works

- Navigate independently between Overview, Assessment, Results, Hospitals and Model & Sources.
- Select 3–30 symptoms from 96 binary features, then submit to the backend. Results use **49 real DDXPlus disease categories**, including Influenza, Pneumonia and Bronchitis. The old artificial A/B/C labels have been removed.
- Inspect the top five candidates, normalized model weights, source-catalogue symptom matches and ICD-10 codes. Unselected symptoms remain unknown.
- Compare three real Bengaluru hospital listings by straight-line distance, search the directory, and open official listings or OpenStreetMap locations. Distance does not establish suitability for treatment.
- Export a research result as JSON. Inputs/results remain in the current tab's memory and are not saved as patient records.

## Research scope

This is **not a clinically validated diagnostic system**. DDXPlus contains medically simulated cases with real disease labels. The model ignores demographics, history, non-binary evidence and examination findings. It cannot detect conditions outside its catalogue. Model weights are not calibrated disease probabilities. Do not use this application for treatment, triage, emergency decisions, or to rule out disease.

The included hospital directory is a curated three-facility Bengaluru snapshot, not a live or comprehensive nearby search. It does not provide appointment booking, treatment matching, live opening hours or bed availability. The architectural image is an illustration, not a photograph of a listed facility.

## Run frontend and backend

Requires Node 20.19+ (Node 22 used in CI).

```sh
npm ci
npm run dev
```

Development: frontend http://127.0.0.1:8201 and API http://127.0.0.1:8200. The frontend proxies API calls to the backend.

```sh
npm run check
npm start
```

Production Node mode serves both frontend and API at http://127.0.0.1:8200. Alternatively, `docker compose up --build -d`. Hosted deployment runs on Cloudflare Workers through Sites with a D1 aggregate request budget. It does not depend on the author's computer being online.

## Structure

```text
apps/frontend/       React screens, navigation, styles and public image
apps/backend/        Hono API, request protection, inference and runtime adapters
packages/contracts/  Shared Zod schemas and attributed symptom catalogue
ml/data/ddxplus/      Source evidence/condition metadata (CC BY 4.0)
ml/artifacts/        Versioned model and hospital directory snapshot
ml/train_ddxplus.py   Reproducible training and official-test-split evaluation
ml/src/              Independent Python inference implementation
scripts/             Build, load check and OpenAPI generation
 tests/              API, component, Python parity and browser verification
 db/ + drizzle/      Aggregate request budget schema and migrations
```

## API

- `GET /api/health/live`, `GET /api/health/ready`
- `GET /api/v1/model` — catalogue, evaluation, version and limitations
- `GET /api/v1/hospitals` — sourced directory snapshot
- `GET /api/v1/openapi.json`
- `POST /api/v1/predictions`

```json
{"symptoms":["E_91","E_201","E_97","E_94","E_144"],"location":{"latitude":12.97,"longitude":77.59},"hospitalLimit":3}
```

The example's highest-ranked research candidate is Influenza. Different symptoms recompute the result. A three-symptom minimum is an input requirement, not a clinical adequacy threshold.

## Reproduce the model

```sh
python -m venv .venv
source .venv/bin/activate
pip install -r ml/requirements-lock.txt
python ml/download_data.py --data-dir .cache/ddxplus
python ml/train_ddxplus.py --data-dir .cache/ddxplus
PYTHONPATH=ml/src python -m unittest discover -s ml/tests -v
```

The download script retrieves the official English DDXPlus archives and checks their published MD5 digests. The trained artifact records SHA-256 digests. Raw archives are excluded from Git. Training used 1,025,602 simulated cases; evaluation used 134,529 official test cases. The fixed positive-evidence Naive Bayes ranker obtained 83.36% top-1 and 94.51% top-3 accuracy. On 120,835 test cases with at least three binary symptoms, a seed-42 three-symptom subsample obtained 73.60% top-1 and 94.06% top-3. These are synthetic benchmark results, not real-patient performance.

`npm run test:browser` covers the five-screen flow in Chromium, Firefox, WebKit and mobile WebKit, with automated axe rules. `npm run test:load` performs a bounded localhost-only check. See [model card](docs/MODEL_CARD.md), [deployment](docs/DEPLOYMENT.md), [readiness](docs/PRODUCTION_READINESS.md) and [sources](SOURCES.md).

## Separate projects

This repository and deployment contain only the disease/hospital application. The CPU scheduler and diabetes benchmark have their own repositories, applications and deployments.
