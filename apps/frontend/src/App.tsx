import { useEffect, useState, type FormEvent } from 'react';
import { getModel, predict } from './api';
import {
  SYMPTOMS,
  symptomLabels,
  type ModelMetadata,
  type PredictionResponse,
} from '../../../packages/contracts/src/index';

type Symptom = (typeof SYMPTOMS)[number];
const labelName = (label: string) =>
  label
    .replace('demo_condition_', 'Demo condition ')
    .replace(/\b([abc])$/, (s) => s.toUpperCase());
export function App() {
  const [model, setModel] = useState<ModelMetadata | null>(null);
  const [serviceError, setServiceError] = useState('');
  const [reload, setReload] = useState(0);
  const [symptoms, setSymptoms] = useState<Symptom[]>([]);
  const [includeHospitals, setIncludeHospitals] = useState(true);
  const [latitude, setLatitude] = useState('12.97');
  const [longitude, setLongitude] = useState('77.59');
  const [result, setResult] = useState<PredictionResponse | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    setServiceError('');
    getModel()
      .then((value) => {
        if (active) setModel(value);
      })
      .catch(() => {
        if (active)
          setServiceError(
            'The prediction service is unavailable. Please try again.',
          );
      });
    return () => {
      active = false;
    };
  }, [reload]);
  const clearResult = () => {
    setResult(null);
    setError('');
  };
  function toggle(id: Symptom) {
    clearResult();
    setSymptoms((values) =>
      values.includes(id) ? values.filter((s) => s !== id) : [...values, id],
    );
  }
  async function submit(event: FormEvent) {
    event.preventDefault();
    clearResult();
    if (!symptoms.length) {
      setError('Select at least one symptom.');
      return;
    }
    const lat = Number(latitude),
      lon = Number(longitude);
    if (
      includeHospitals &&
      (!latitude.trim() ||
        !longitude.trim() ||
        !Number.isFinite(lat) ||
        !Number.isFinite(lon) ||
        Math.abs(lat) > 90 ||
        Math.abs(lon) > 180)
    ) {
      setError(
        'Enter a latitude between −90 and 90 and longitude between −180 and 180.',
      );
      return;
    }
    setBusy(true);
    try {
      setResult(
        await predict({
          symptoms,
          ...(includeHospitals
            ? { location: { latitude: lat, longitude: lon }, hospitalLimit: 3 }
            : {}),
        }),
      );
    } catch (failure) {
      setError(
        failure instanceof Error
          ? failure.message
          : 'The request failed. Please try again.',
      );
    } finally {
      setBusy(false);
    }
  }
  function download() {
    if (!result) return;
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' }),
    );
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'disease-demo-result.json';
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return (
    <>
      <header className="site-header">
        <div className="header-inner">
          <a href="/" className="brand">
            <span className="brand-mark">DP</span>
            <span>
              Disease prediction<small>Suraj Suman · Portfolio project</small>
            </span>
          </a>
          <a
            className="source-link"
            href="https://github.com/surajsuman23/disease-hospital-recommender"
            target="_blank"
            rel="noreferrer"
          >
            Source code ↗
          </a>
        </div>
      </header>
      <main>
        <section className="page-heading">
          <p className="eyebrow">SYMPTOM CLASSIFICATION & HOSPITAL RANKING</p>
          <h1>Explore symptom patterns.</h1>
          <p>
            Select example symptoms to run the model, then compare distances to
            fictional facilities.
          </p>
        </section>
        <aside className="demo-notice">
          <strong>Educational demonstration</strong>
          <span>
            Synthetic condition labels and fictional hospitals. This is not a
            diagnosis or a recommendation for real care.
          </span>
        </aside>
        {serviceError && (
          <div role="alert" className="error-banner">
            {serviceError}{' '}
            <button
              className="text-button"
              onClick={() => setReload((x) => x + 1)}
            >
              Retry connection
            </button>
          </div>
        )}
        <div className="workspace">
          <form
            className="card input-card"
            onSubmit={submit}
            aria-label="Prediction inputs"
          >
            <fieldset disabled={busy || !model}>
              <div className="section-heading">
                <h2>
                  <span className="step">01</span> Select symptoms
                </h2>
                <span className="count">{symptoms.length} selected</span>
              </div>
              <p className="helper">Choose one or more example features.</p>
              <div className="symptom-grid">
                {SYMPTOMS.map((id) => (
                  <label
                    className={`symptom ${symptoms.includes(id) ? 'selected' : ''}`}
                    key={id}
                  >
                    <input
                      type="checkbox"
                      checked={symptoms.includes(id)}
                      onChange={() => toggle(id)}
                    />
                    <span>{symptomLabels[id]}</span>
                  </label>
                ))}
              </div>
              <div className="sample-actions">
                <button
                  type="button"
                  className="text-button"
                  onClick={() => {
                    clearResult();
                    setSymptoms(['fever', 'cough']);
                    setLatitude('12.97');
                    setLongitude('77.59');
                  }}
                >
                  Use example
                </button>
                <button
                  type="button"
                  className="text-button muted"
                  onClick={() => {
                    clearResult();
                    setSymptoms([]);
                  }}
                >
                  Clear selection
                </button>
              </div>
              <div className="section-heading location-heading">
                <h2>
                  <span className="step">02</span> Rank hospitals
                </h2>
              </div>
              <label className="check-row">
                <input
                  type="checkbox"
                  checked={includeHospitals}
                  onChange={(e) => {
                    clearResult();
                    setIncludeHospitals(e.target.checked);
                  }}
                />
                Include fictional facilities
              </label>
              {includeHospitals && (
                <>
                  <p className="helper">
                    The example coordinates are in Bengaluru. Distances use a
                    straight-line calculation, not travel time.
                  </p>
                  <div className="coordinates">
                    <label>
                      Latitude
                      <input
                        aria-label="Latitude"
                        type="number"
                        step="any"
                        min="-90"
                        max="90"
                        required
                        value={latitude}
                        onChange={(e) => {
                          clearResult();
                          setLatitude(e.target.value);
                        }}
                      />
                    </label>
                    <label>
                      Longitude
                      <input
                        aria-label="Longitude"
                        type="number"
                        step="any"
                        min="-180"
                        max="180"
                        required
                        value={longitude}
                        onChange={(e) => {
                          clearResult();
                          setLongitude(e.target.value);
                        }}
                      />
                    </label>
                  </div>
                </>
              )}
              <button
                className="primary-button"
                type="submit"
                disabled={busy || !model}
              >
                {busy
                  ? 'Calculating…'
                  : !model
                    ? 'Connecting to service…'
                    : 'Run demonstration'}
                <span aria-hidden="true">→</span>
              </button>
            </fieldset>
            <p className="privacy-note">
              Inputs are sent to the API for this calculation. The application
              does not save prediction records.
            </p>
          </form>
          <section
            className="card result-card"
            aria-label="Prediction results"
            aria-busy={busy}
          >
            <div className="section-heading">
              <h2>Result overview</h2>
              <span
                className={`status ${result ? 'complete' : ''}`}
                role="status"
              >
                {busy ? 'Processing' : result ? 'Complete' : 'Ready for inputs'}
              </span>
            </div>
            {error && (
              <p className="error-banner" role="alert">
                {error}
              </p>
            )}
            {!result && (
              <div className="empty-state">
                <span className="empty-symbol" aria-hidden="true">
                  ⌁
                </span>
                <h3>
                  {busy ? 'Running the model' : 'Your results will appear here'}
                </h3>
                <p>
                  {busy
                    ? 'Classifying the selected features and calculating distances.'
                    : 'Choose symptoms on the left, or use the example to explore the workflow.'}
                </p>
              </div>
            )}
            {result && (
              <>
                <div className="prediction-summary">
                  <span className="eyebrow">SYNTHETIC MODEL OUTPUT</span>
                  <h3>{labelName(result.label)}</h3>
                  <p>
                    {result.selectedSymptoms
                      .map((id) => symptomLabels[id])
                      .join(' · ')}
                  </p>
                </div>
                <h3 className="subheading">Relative model scores</h3>
                <p className="helper">
                  These scores describe the synthetic classes. They are not
                  disease probabilities or clinical confidence.
                </p>
                <div className="scores">
                  {result.scores.map((score) => (
                    <div className="score" key={score.label}>
                      <div>
                        <span>{labelName(score.label)}</span>
                        <strong>{(score.score * 100).toFixed(1)}%</strong>
                      </div>
                      <progress
                        aria-label={labelName(score.label) + ' model score'}
                        max={1}
                        value={score.score}
                      />
                    </div>
                  ))}
                </div>
                <div className="result-divider" />
                <h3 className="subheading">
                  {result.rankingIncluded
                    ? 'Nearest fictional facilities'
                    : 'Hospital ranking is off'}
                </h3>
                {result.rankingIncluded ? (
                  <>
                    <p className="helper">
                      Facilities supporting the demo class, ordered by distance.
                    </p>
                    <ol className="hospital-list">
                      {result.hospitals.map((hospital, index) => (
                        <li key={hospital.name}>
                          <span className="hospital-rank">{index + 1}</span>
                          <div>
                            <strong>{hospital.name}</strong>
                            <span>
                              Fictional facility · {hospital.latitude},{' '}
                              {hospital.longitude}
                            </span>
                          </div>
                          <b>
                            {hospital.distanceKm.toFixed(2)}
                            <small>km</small>
                          </b>
                        </li>
                      ))}
                    </ol>
                    {!result.hospitals.length && (
                      <p>No matching fictional facilities.</p>
                    )}
                  </>
                ) : (
                  <p className="helper">
                    Enable hospital ranking for a distance comparison.
                  </p>
                )}
                <div className="result-footer">
                  <span>Model: {result.modelVersion}</span>
                  <button
                    type="button"
                    className="text-button"
                    onClick={download}
                  >
                    Download JSON
                  </button>
                </div>
              </>
            )}
          </section>
        </div>
        <details className="model-notes">
          <summary>Model, evaluation & privacy notes</summary>
          {model ? (
            <div className="notes-grid">
              <section>
                <h3>How this demo works</h3>
                <p>
                  A {model.algorithm} classifier uses eight binary features.{' '}
                  {model.dataset}. The backend serves a versioned model exported
                  from the Python training pipeline.
                </p>
                <p>
                  The labels have no medical meaning. Low test performance is
                  shown honestly; this model must not be used for healthcare
                  decisions.
                </p>
              </section>
              <section>
                <h3>Measured evaluation</h3>
                <dl>
                  <div>
                    <dt>Training / holdout rows</dt>
                    <dd>
                      {model.trainRows} / {model.testRows}
                    </dd>
                  </div>
                  <div>
                    <dt>Holdout accuracy</dt>
                    <dd>{(model.holdoutAccuracy * 100).toFixed(1)}%</dd>
                  </div>
                  <div>
                    <dt>Holdout macro F1</dt>
                    <dd>{model.holdoutMacroF1.toFixed(3)}</dd>
                  </div>
                </dl>
                <p>{model.privacy}</p>
                <a href="/api/v1/openapi.json" target="_blank" rel="noreferrer">
                  API specification ↗
                </a>
              </section>
            </div>
          ) : (
            <p>Model details are unavailable until the API connects.</p>
          )}
        </details>
        <footer className="page-footer">
          <span>Disease Prediction & Hospital Ranking</span>
          <span>Independent project · Suraj Suman</span>
        </footer>
      </main>
    </>
  );
}
