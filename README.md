# Disease Prediction and Hospital Recommendation System

**[Open interactive demo](https://suraj-suman-projects.m16labs-0951.chatgpt.site/hospital.html)**


An educational **synthetic demonstration** of symptom classification followed by geographic ranking of fictional hospitals. It compares KNN and Bernoulli Naive Bayes and demonstrates input validation, model evaluation and distance-based ranking.

**The bundled demo does not identify real diseases or recommend real hospitals.** It uses fictional labels and hospital records to demonstrate the workflow without using patient records.

## Implementation

This repository includes the command-line implementation, an interactive browser demo, tests and documentation. Reported results apply to the documented implementation and runtime. References and data sources are listed in `SOURCES.md`.

## Setup

Requires Python 3.11 or newer. Run these commands from this project folder:

```sh
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
```

On Windows, activate with `.venv\Scripts\activate` instead.

## Run the complete demo

```sh
python recommender.py --symptoms fever,cough --latitude 12.97 --longitude 77.59
python -m unittest discover -v
```

The coordinates above are demonstration inputs, not a user's location. The program works offline after dependency installation.

Recognized symptom names: `fever`, `cough`, `fatigue`, `headache`, `nausea`, `rash`, `sneezing`, `body_ache`. Unknown names and empty symptom selections are rejected.

## How it works

- Generate all 256 unique binary combinations of eight symptom flags. Assign `demo_condition_a`, `demo_condition_b`, and `demo_condition_c` using an arbitrary mathematical rule. This rule contains **no medical knowledge**.
- Split the synthetic data into stratified training and test sets. Compare KNN and Bernoulli Naive Bayes using three-fold training CV macro F1; evaluate the selected configurations on the holdout.
- Classify the demonstration input, filter fictional hospital records by supported demo label, then sort by Haversine distance.
- Write `reports/demo_result.json` and `reports/synthetic_symptoms.csv`.

Metrics only describe this artificial classification task. Low scores reflect that arbitrary labels can be difficult for these models; they must not be described as clinical accuracy. Hospital distances are straight-line distances, not driving times, availability, quality scores, or verified capabilities.

## Data contract

The reusable functions `validate_symptoms`, `fit_models`, `classify`, and `rank_hospitals` accept pandas data frames. The CLI deliberately uses the synthetic demo only.

Symptom data needs the eight binary columns above plus `condition`. The validator rejects missing flags, inconsistent labels for an identical pattern, and classes with too few examples.

Hospital data needs `name,latitude,longitude,conditions`; semicolons separate supported labels and `all` matches every label. The checked-in file is entirely fictional. Coordinates are illustrative and do not identify the named facilities because those facilities do not exist.

## What is needed for a real research extension

A suitably licensed, documented dataset; an independently verified hospital directory; a justified clinical label-to-specialty mapping; external validation; and domain expert review. These are not supplied or claimed here. Do not use this demo to decide where or whether to seek medical care.

## Browser interface

The `docs/` folder contains a standalone browser interface. To run it locally from the repository root:

```sh
python3 -m http.server 8080 --directory docs
```

Open http://localhost:8080. Serve these files over HTTP or HTTPS; opening `index.html` directly as a file does not support the worker and module imports.

The interface loads Python through Pyodide 0.27.5 in a dedicated Web Worker and executes the project's original Python module. The first run downloads Python and scientific packages from the jsDelivr CDN, so it needs an internet connection and may take a minute. Later runs reuse the loaded runtime while the page remains open. Inputs and calculations stay in the browser; there is no application account or server-side input storage.

The browser runtime uses scikit-learn 1.6.1, pandas 2.2.3 and NumPy 2.0.2. These differ from the original desktop benchmark environment; exported result JSON records the actual runtime versions. Results should always be quoted with their runtime and split configuration.

The public demo is hosted independently of this computer. The project can also be served from the `docs/` directory on a static host.
