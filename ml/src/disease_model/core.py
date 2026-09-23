"""Synthetic symptom-classification and hospital-distance demonstration."""
import argparse
import itertools
import json
import math
from pathlib import Path
import numpy as np
import pandas as pd
from sklearn.metrics import accuracy_score, f1_score
from sklearn.model_selection import StratifiedKFold, cross_val_score, train_test_split
from sklearn.naive_bayes import BernoulliNB
from sklearn.neighbors import KNeighborsClassifier

SYMPTOMS = ['fever', 'cough', 'fatigue', 'headache', 'nausea', 'rash', 'sneezing', 'body_ache']
NOTICE = 'SYNTHETIC DEMO: fictional condition labels and hospitals. Not a diagnosis or real care recommendation.'

def synthetic_data():
    """All 256 unique binary patterns; labels are arbitrary, not medical rules."""
    rows = []
    for pattern in itertools.product([0, 1], repeat=len(SYMPTOMS)):
        label = ['demo_condition_a', 'demo_condition_b', 'demo_condition_c'][
            (sum(pattern[:3]) + 2 * sum(pattern[3:6]) + sum(pattern[6:])) % 3]
        rows.append(dict(zip(SYMPTOMS, pattern), condition=label))
    return pd.DataFrame(rows)

def validate_symptoms(frame):
    if set(frame.columns) != set(SYMPTOMS + ['condition']):
        raise ValueError('CSV must contain exactly the eight documented symptom columns and condition.')
    result = frame[SYMPTOMS + ['condition']].copy()
    if result['condition'].isna().any() or result['condition'].astype(str).str.strip().eq('').any():
        raise ValueError('Condition labels cannot be empty.')
    if not result[SYMPTOMS].isin([0, 1]).all().all():
        raise ValueError('Symptoms must be binary 0 or 1, without missing values.')
    result = result.drop_duplicates().reset_index(drop=True)
    if result.groupby(SYMPTOMS, dropna=False)['condition'].nunique().max() > 1:
        raise ValueError('The same symptom pattern has conflicting labels.')
    counts = result['condition'].value_counts()
    if len(counts) < 2 or counts.min() < 8:
        raise ValueError('Need at least two classes, with eight unique examples per class.')
    return result

def fit_models(frame, seed=42):
    frame = validate_symptoms(frame)
    X_train, X_test, y_train, y_test = train_test_split(
        frame[SYMPTOMS], frame['condition'], test_size=.25, stratify=frame['condition'], random_state=seed)
    cv = StratifiedKFold(n_splits=3, shuffle=True, random_state=seed)
    models = {'knn': KNeighborsClassifier(n_neighbors=3), 'naive_bayes': BernoulliNB()}
    report = {'seed': seed, 'train_rows': len(X_train), 'test_rows': len(X_test), 'models': {}}
    for name, model in models.items():
        score = cross_val_score(model, X_train, y_train, scoring='f1_macro', cv=cv, error_score='raise').mean()
        model.fit(X_train, y_train)
        prediction = model.predict(X_test)
        report['models'][name] = {'training_cv_macro_f1': float(score),
                                  'test_accuracy': float(accuracy_score(y_test, prediction)),
                                  'test_macro_f1': float(f1_score(y_test, prediction, average='macro', zero_division=0))}
    selected = max(models, key=lambda name: report['models'][name]['training_cv_macro_f1'])
    report['selected_model'] = selected
    return models[selected], report

def validate_coordinates(latitude, longitude):
    if not all(math.isfinite(x) for x in [latitude, longitude]) or not -90 <= latitude <= 90 or not -180 <= longitude <= 180:
        raise ValueError('Latitude must be between -90 and 90; longitude between -180 and 180.')

def haversine_km(lat1, lon1, lat2, lon2):
    validate_coordinates(lat1, lon1); validate_coordinates(lat2, lon2)
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dp, dl = math.radians(lat2 - lat1), math.radians(lon2 - lon1)
    value = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return 6371.0088 * 2 * math.asin(math.sqrt(min(1, max(0, value))))

def rank_hospitals(hospitals, condition, latitude, longitude, limit=3):
    validate_coordinates(latitude, longitude)
    if limit < 1: raise ValueError('Limit must be positive.')
    required = {'name', 'latitude', 'longitude', 'conditions'}
    if not required.issubset(hospitals.columns): raise ValueError(f'Hospital CSV requires {sorted(required)}')
    found = []
    for row in hospitals.to_dict('records'):
        if any(pd.isna(row[key]) for key in required): raise ValueError('Hospital fields cannot be missing.')
        lat, lon = float(row['latitude']), float(row['longitude'])
        validate_coordinates(lat, lon)
        supported = str(row['conditions']).split(';')
        if condition not in supported and 'all' not in supported: continue
        found.append({'name': str(row['name']), 'distance_km': round(haversine_km(latitude, longitude, lat, lon), 3),
                      'latitude': lat, 'longitude': lon})
    return sorted(found, key=lambda row: (row['distance_km'], row['name']))[:limit]

def classify(model, symptoms):
    unknown = set(symptoms) - set(SYMPTOMS)
    if unknown: raise ValueError(f'Unknown symptoms: {sorted(unknown)}')
    if not symptoms: raise ValueError('Choose at least one symptom for the demonstration.')
    X = pd.DataFrame([{symptom: int(symptom in symptoms) for symptom in SYMPTOMS}])
    return str(model.predict(X)[0])

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--symptoms', required=True, help='Comma-separated names; see README.')
    parser.add_argument('--latitude', type=float, required=True)
    parser.add_argument('--longitude', type=float, required=True)
    parser.add_argument('--output', type=Path, default=Path('reports'))
    args = parser.parse_args()
    try:
        validate_coordinates(args.latitude, args.longitude)
        frame = synthetic_data()
        model, report = fit_models(frame)
        condition = classify(model, [s.strip() for s in args.symptoms.split(',') if s.strip()])
        hospitals = pd.read_csv(Path(__file__).resolve().parents[2] / 'data' / 'fictional_hospitals.csv')
        report.update({'notice': NOTICE, 'data_source': 'generated synthetic patterns', 'predicted_demo_label': condition,
                       'nearby_fictional_hospitals': rank_hospitals(hospitals, condition, args.latitude, args.longitude)})
        args.output.mkdir(parents=True, exist_ok=True)
        (args.output / 'demo_result.json').write_text(json.dumps(report, indent=2) + '\n')
        frame.to_csv(args.output / 'synthetic_symptoms.csv', index=False)
        print(json.dumps(report, indent=2))
    except (ValueError, OSError) as error:
        parser.exit(2, f'Error: {error}\n')

if __name__ == '__main__': main()
