import { useEffect, useState, type FormEvent } from 'react';
import { getModel, predict } from './api';
import { ResultPanel } from './components/ResultPanel';
import { ModelNotes } from './components/ModelNotes';
import {
  SYMPTOMS,
  symptomLabels,
  type ModelMetadata,
  type PredictionResponse,
} from '../../../packages/contracts/src/index';

type Symptom = (typeof SYMPTOMS)[number];
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
              Disease Prediction Workspace
              <small>Suraj Suman · Portfolio project</small>
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
          <h1>From symptoms to a ranked result.</h1>
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
        <div className="flow-guide" aria-label="Workflow">
          <span>
            <b>1</b> Select example symptoms
          </span>
          <span>
            <b>2</b> Set a location
          </span>
          <span>
            <b>3</b> Compare the output
          </span>
        </div>
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
          <ResultPanel
            result={result}
            busy={busy}
            error={error}
            download={download}
          />
        </div>
        <ModelNotes model={model} />
        <footer className="page-footer">
          <span>Disease Prediction & Hospital Ranking</span>
          <span>Independent project · Suraj Suman</span>
        </footer>
      </main>
    </>
  );
}
