# Model card

## Intended use

A student research demonstration of symptom-based candidate ranking and full-stack model deployment. No diagnosis, triage, treatment or patient-care use. Disease names are real; training and test cases are simulated.

## Data and attribution

DDXPlus English v2, Arsene Fansi Tchango and colleagues, NeurIPS 2022. DOI: https://doi.org/10.6084/m9.figshare.22687585.v2. Licensed CC BY 4.0. The source repository documents its proprietary medical-knowledge-base simulation process: https://github.com/mila-iqia/ddxplus.

Adaptations: 96 binary symptoms selected from the published evidence metadata; antecedents and categorical/multi-choice evidence omitted. The UI shortens several questions; full source questions remain in the catalogue. All 49 source disease classes retained. No handwritten disease-name substitutions or fabricated outcome labels.

## Algorithm

Training counts positive occurrences for each symptom and class over 1,025,602 official training records. Laplace-smoothed Bernoulli symptom likelihoods `(positive_count + 1)/(class_count + 2)` and uniform class priors are exported. At inference, log likelihoods for selected symptoms are summed with the log prior. Unselected symptoms are UNKNOWN and contribute no negative evidence. Softmax normalizes the weights across 49 categories. Those weights are not calibrated real-world probabilities; uniform priors do not represent disease prevalence.

The model family and smoothing were fixed before official test evaluation, with no test-driven hyperparameter tuning. An independent Python inference implementation and the TypeScript serving implementation are compared against 80 exported test fixtures.

## Measured evaluation

Official test split, 134,529 nonempty binary-feature cases:

- Top-1: 0.8335526169
- Top-3: 0.9451122063
- Macro F1: 0.8458070002
- Three randomly selected positive features (seed 42), 120,835 eligible cases: top-1 0.7360367443; top-3 0.9406049572.

Cases originate from the same simulator; feature patterns may recur between splits. This is not an evaluation of unseen clinical populations. A three-symptom random subset is not equivalent to how real visitors report symptoms. Inputting additional features does not guarantee greater accuracy.

## Material limits

The catalogue is closed and omits many diseases. Age, sex, duration, severity, medical history, physical examination, tests, symptom absence and non-binary features are not used. Correlated symptoms violate naive conditional independence. Some rare or severe conditions may rank highly for nonspecific inputs. The interface displays this as research output and provides no treatment or reassurance. Clinical validation and independent medical review have not occurred.

Hospital ranking is a separate straight-line geographic calculation. It never uses predicted disease to claim facility suitability. There are three sourced Bengaluru listings; availability is not live.

## Privacy and reproducibility

No patient or prediction records are saved. Training archives are official simulated data, not personal user data. Model JSON includes version, source digest, class counts and evaluation. See `ml/download_data.py` and `ml/train_ddxplus.py` for reproduction. No user input can load code, select arbitrary models or alter training.
