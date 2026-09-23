# Model card

## Intended use

Engineering demonstration of a classification API and fictional facility ranking. Not for diagnosis, triage, treatment, insurance decisions, patient care or real hospital selection.

## Data and labels

The training source is the project-generated set of all 256 unique combinations of eight binary features. Labels are assigned using an arbitrary modulo-three rule. They are named `demo_condition_a`, `demo_condition_b` and `demo_condition_c`; they do not represent actual diseases. Four fictional facilities are supplied around example Bengaluru coordinates.

## Training and evaluation

The split is stratified 75/25 with seed 42: 192 training rows and 64 holdout rows. KNN and Bernoulli Naive Bayes are compared using three-fold training macro F1. BernoulliNB is selected on training cross-validation, without using the holdout for selection.

The exported implementation measured holdout accuracy **0.171875** and macro F1 **0.16602728047740836**. These are poor results on an artificial task and are displayed without an efficacy claim. Relative model scores are not calibrated disease probabilities.

## Serving consistency

The backend evaluates the exported class priors and Bernoulli feature log-probabilities using log-sum-exp normalization. Label and probability parity is checked against the Python model on all 256 patterns (probabilities agree to 12 decimal places). This validates implementation consistency, not medical validity or predictive quality.

## Release gate for a real model

A real model requires appropriately licensed, representative data; review of target labels and intended use; leakage-resistant evaluation; external validation; calibration and subgroup analysis; drift monitoring; and qualified clinical review. None of these is satisfied by replacing the displayed demo labels with disease names. Do not relabel the existing artifact as clinical.
