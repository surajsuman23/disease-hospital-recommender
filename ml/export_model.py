"""Train, evaluate and export a reproducible, nonclinical BernoulliNB model."""
import hashlib
import json
import platform
import sys
from pathlib import Path
import numpy as np
import pandas as pd
import sklearn

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'ml/src'))
from disease_model.core import SYMPTOMS, NOTICE, synthetic_data, fit_models

frame = synthetic_data()
model, report = fit_models(frame, seed=42)
if report['selected_model'] != 'naive_bayes':
    raise RuntimeError('The serving adapter supports BernoulliNB only; review a changed training result.')
parameters = {'classes': model.classes_.tolist(), 'classLogPrior': model.class_log_prior_.tolist(),
              'featureLogProbability': model.feature_log_prob_.tolist(), 'features': SYMPTOMS}
canonical = json.dumps(parameters, sort_keys=True, separators=(',', ':'))
model_id = 'synthetic-nb-' + hashlib.sha256(canonical.encode()).hexdigest()[:12]
artifact = dict(parameters, version=model_id, algorithm='BernoulliNB', schemaVersion=1,
                dataset='256 exhaustive binary patterns with arbitrary labels; synthetic',
                datasetSha256=hashlib.sha256(frame.to_csv(index=False).encode()).hexdigest(),
                notice=NOTICE, clinicalUse=False, seed=42, evaluation=report,
                runtime={'python': platform.python_version(), 'scikitLearn': sklearn.__version__, 'numpy': np.__version__, 'pandas': pd.__version__})
path = ROOT / 'ml/artifacts/model.json'
path.write_text(json.dumps(artifact, indent=2) + '\n')
X = frame[SYMPTOMS]
probabilities = model.predict_proba(X)
labels = model.predict(X)
fixtures = [{'symptoms': [s for s in SYMPTOMS if int(row[s])], 'label': str(labels[i]),
             'probabilities': probabilities[i].tolist()} for i, row in X.iterrows()]
(ROOT / 'tests/fixtures/model-parity.json').write_text(json.dumps(fixtures, indent=2)+'\n')
hospitals=pd.read_csv(ROOT / 'ml/data/fictional_hospitals.csv').to_dict('records')
(ROOT / 'ml/artifacts/hospitals.json').write_text(json.dumps(hospitals, indent=2)+'\n')
print(f'Exported {model_id}; {len(fixtures)} parity cases; accuracy {report["models"]["naive_bayes"]["test_accuracy"]:.4f}.')
