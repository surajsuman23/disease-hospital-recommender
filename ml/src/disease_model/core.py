"""Positive-evidence inference for the versioned DDXPlus research artifact."""
import json,math
from pathlib import Path

def load_model(path=None):
    path=Path(path) if path else Path(__file__).resolve().parents[2]/'artifacts/model.json'
    model=json.loads(path.read_text())
    if model['clinicalUse'] is not False:raise ValueError('Only research artifacts supported')
    return model

def classify(model,symptoms):
    if not symptoms or len(set(symptoms))!=len(symptoms):raise ValueError('Unique symptoms required')
    if any(s not in model['features'] for s in symptoms):raise ValueError('Unknown symptom')
    indices=[model['features'].index(s) for s in symptoms]
    values=[model['classLogPrior'][i]+sum(model['featureLogProbability'][i][j] for j in indices) for i in range(len(model['classes']))]
    maximum=max(values);weights=[math.exp(v-maximum) for v in values];total=sum(weights)
    return {'label':model['classes'][values.index(maximum)],'scores':[w/total for w in weights]}
