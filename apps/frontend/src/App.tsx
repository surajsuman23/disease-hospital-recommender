import { useEffect, useState, type FormEvent } from 'react';
import { getModel, getHospitals, predict } from './api';
import { AppShell, useScreen } from './components/AppShell';
import { HospitalCards } from './components/HospitalCards';
import {
  symptomLabels,
  type ModelMetadata,
  type PredictionResponse,
  type Hospital,
} from '../../../packages/contracts/src';
const example = ['E_91', 'E_201', 'E_97', 'E_94', 'E_144'];
const pct = (n: number) => (n * 100).toFixed(1) + '%';
export function App() {
  const { screen, navigate } = useScreen();
  const [model, setModel] = useState<ModelMetadata | null>(null),
    [hospitals, setHospitals] = useState<Hospital[]>([]),
    [serviceError, setServiceError] = useState(''),
    [reload, setReload] = useState(0);
  const [symptoms, setSymptoms] = useState<string[]>([]),
    [query, setQuery] = useState(''),
    [group, setGroup] = useState('Common'),
    [latitude, setLatitude] = useState('12.97'),
    [longitude, setLongitude] = useState('77.59'),
    [includeHospitals, setIncludeHospitals] = useState(true);
  const [result, setResult] = useState<PredictionResponse | null>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [hospitalQuery, setHospitalQuery] = useState(''),
    [conditionQuery, setConditionQuery] = useState(''),
    [openCondition, setOpenCondition] = useState('');
  useEffect(() => {
    let active = true;
    setServiceError('');
    Promise.all([getModel(), getHospitals()])
      .then(([m, h]) => {
        if (active) {
          setModel(m);
          setHospitals(h);
        }
      })
      .catch(() => {
        if (active)
          setServiceError(
            'The service could not load. Check your connection and try again.',
          );
      });
    return () => {
      active = false;
    };
  }, [reload]);
  const clear = () => {
    setResult(null);
    setError('');
  };
  const toggle = (id: string) => {
    clear();
    setSymptoms((v) =>
      v.includes(id)
        ? v.filter((s) => s !== id)
        : v.length < 30
          ? [...v, id]
          : v,
    );
  };
  const loadExample = () => {
    clear();
    setSymptoms(example);
    setGroup('Common');
    setQuery('');
    navigate('assessment');
  };
  async function submit(e: FormEvent) {
    e.preventDefault();
    clear();
    if (symptoms.length < 3) {
      setError('Select at least three symptoms to compare disease candidates.');
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
        'Enter valid coordinates: latitude −90 to 90, longitude −180 to 180.',
      );
      return;
    }
    setBusy(true);
    navigate('results');
    try {
      setResult(
        await predict({
          symptoms,
          ...(includeHospitals
            ? { location: { latitude: lat, longitude: lon }, hospitalLimit: 3 }
            : {}),
        }),
      );
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
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
    const a = document.createElement('a');
    a.href = url;
    a.download = 'arovia-research-result.json';
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  const filtered =
    model?.symptoms.filter(
      (s) =>
        (query
          ? true
          : group === 'All symptoms' ||
            (group === 'Common' && s.common) ||
            group === s.group) &&
        `${s.label} ${s.question}`.toLowerCase().includes(query.toLowerCase()),
    ) ?? [];
  const ranked = result
    ? [...result.scores].sort((a, b) => b.score - a.score).slice(0, 5)
    : [];
  const directory = (
    result?.rankingIncluded ? result.hospitals : hospitals
  ).filter((h) =>
    `${h.name} ${h.area}`.toLowerCase().includes(hospitalQuery.toLowerCase()),
  );
  return (
    <AppShell screen={screen} navigate={navigate}>
      {serviceError && (
        <div className="error-banner" role="alert">
          {serviceError}{' '}
          <button onClick={() => setReload((v) => v + 1)}>
            Retry connection
          </button>
        </div>
      )}
      {screen === 'dashboard' && (
        <>
          <div className="page-title">
            <div>
              <p className="eyebrow">YOUR RESEARCH WORKSPACE</p>
              <h1>A clearer view of symptoms.</h1>
              <p>
                Explore disease candidates and a sourced hospital directory.
              </p>
            </div>
            <button className="primary" onClick={() => navigate('assessment')}>
              Start assessment <span aria-hidden="true">↗</span>
            </button>
          </div>
          <section className="dashboard-hero">
            <div className="hero-copy">
              <span className="hero-kicker">
                SYMPTOMS → EVIDENCE → EXPLORATION
              </span>
              <h2>
                Better questions.
                <br />
                More informed exploration.
              </h2>
              <p>
                Choose symptoms, see the model’s ranked disease candidates, and
                understand what supports each result.
              </p>
              <div className="button-row">
                <button
                  className="primary"
                  onClick={() => navigate('assessment')}
                >
                  Explore symptoms →
                </button>
                <button className="secondary" onClick={loadExample}>
                  Try an example
                </button>
              </div>
              <span className="hero-note">
                Research demonstration. Results require professional
                interpretation.
              </span>
            </div>
            <img
              src="/images/hospital-atrium.png"
              alt="Illustrative modern hospital atrium with natural light"
            />
            <span className="image-caption">
              Illustrative hospital interior
            </span>
          </section>
          <div className="metric-grid">
            <div className="metric">
              <span>Disease categories</span>
              <strong>{model?.conditions.length ?? '—'}</strong>
              <small>Real names in DDXPlus</small>
            </div>
            <div className="metric">
              <span>Symptom features</span>
              <strong>{model?.symptoms.length ?? '—'}</strong>
              <small>Searchable binary questions</small>
            </div>
            <div className="metric">
              <span>Listed hospitals</span>
              <strong>{hospitals.length || '—'}</strong>
              <small>Bengaluru directory</small>
            </div>
            <div className="metric">
              <span>Current assessment</span>
              <strong>{result ? 'Ready' : 'Not started'}</strong>
              <small>
                {result
                  ? 'Available in this tab only'
                  : 'No personal records stored'}
              </small>
            </div>
          </div>
          <div className="dashboard-bottom">
            <section className="panel">
              <div className="panel-heading">
                <h2>Your assessment</h2>
                <span className="pill">THIS SESSION</span>
              </div>
              {result ? (
                <>
                  <p className="large-line">
                    {result.selectedSymptoms.length} symptoms explored
                  </p>
                  <p>
                    Your last result is ready. Disease candidates are research
                    outputs, not diagnoses.
                  </p>
                  <button
                    className="text-button"
                    onClick={() => navigate('results')}
                  >
                    View assessment results →
                  </button>
                </>
              ) : (
                <>
                  <p className="large-line">
                    Start with what you want to explore.
                  </p>
                  <p>
                    Select at least three symptoms. A separate results page
                    shows candidate names, matching evidence, and hospital
                    distances.
                  </p>
                  <button className="text-button" onClick={loadExample}>
                    Load a five-symptom example →
                  </button>
                </>
              )}
            </section>
            <section className="panel model-overview">
              <span className="eyebrow">UNDER THE HOOD</span>
              <h2>A model you can inspect.</h2>
              <p>
                Trained on published, medically simulated DDXPlus cases. Its
                evaluation, data license and limitations are available inside
                the app.
              </p>
              <button className="text-button" onClick={() => navigate('about')}>
                See model & sources →
              </button>
            </section>
          </div>
          <p className="clinical-note">
            This app is not for diagnosis, treatment or emergency decisions. For
            severe breathing difficulty, chest pain, or sudden weakness, seek
            urgent local medical help.
          </p>
        </>
      )}
      {screen === 'assessment' && (
        <>
          <div className="page-title">
            <div>
              <p className="eyebrow">01 / SYMPTOM ASSESSMENT</p>
              <h1>What would you like to explore?</h1>
              <p>Select 3–30 symptoms. Unselected symptoms remain unknown.</p>
            </div>
            <button className="secondary" onClick={loadExample} disabled={busy}>
              Load example
            </button>
          </div>
          <form onSubmit={submit} className="assessment-layout">
            <section className="panel symptom-panel">
              <label className="search-label">
                Find a symptom
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search fever, cough, fatigue…"
                  disabled={!model || busy}
                />
              </label>
              <div className="filter-tabs" aria-label="Symptom groups">
                {[
                  'Common',
                  'Breathing & ENT',
                  'Digestive',
                  'General & other',
                  'All symptoms',
                ].map((g) => (
                  <button
                    key={g}
                    type="button"
                    aria-pressed={g === group}
                    onClick={() => {
                      setGroup(g);
                      setQuery('');
                    }}
                  >
                    {g}
                  </button>
                ))}
              </div>
              <div className="list-caption">
                <span>{filtered.length} symptoms shown</span>
                <span>{symptoms.length} / 30 selected</span>
              </div>
              <fieldset className="symptom-list" disabled={busy || !model}>
                <legend className="sr-only">Select symptoms</legend>
                {filtered.map((s) => (
                  <label
                    className={
                      'symptom-option ' +
                      (symptoms.includes(s.id) ? 'selected' : '')
                    }
                    key={s.id}
                  >
                    <input
                      type="checkbox"
                      checked={symptoms.includes(s.id)}
                      onChange={() => toggle(s.id)}
                      disabled={
                        !symptoms.includes(s.id) && symptoms.length >= 30
                      }
                    />
                    <span>{s.label}</span>
                  </label>
                ))}
                {!filtered.length && (
                  <p>
                    {model
                      ? 'No matching symptoms. Try another search.'
                      : 'Loading symptom catalogue…'}
                  </p>
                )}
              </fieldset>
            </section>
            <aside className="panel assessment-summary">
              <div className="panel-heading">
                <h2>Your selection</h2>
                <span className="count-badge">{symptoms.length}</span>
              </div>
              {symptoms.length ? (
                <div className="selected-chips">
                  {symptoms.map((id) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => toggle(id)}
                      disabled={busy}
                      aria-label={'Remove ' + symptomLabels[id]}
                    >
                      {symptomLabels[id]} <span aria-hidden="true">×</span>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="empty-caption">
                  Your selected symptoms will appear here.
                </p>
              )}
              <button
                className="text-button small"
                type="button"
                onClick={() => {
                  clear();
                  setSymptoms([]);
                }}
                disabled={busy || !symptoms.length}
              >
                Clear selection
              </button>
              <hr />
              <h3>Hospital distances</h3>
              <label className="check-row">
                <input
                  type="checkbox"
                  checked={includeHospitals}
                  disabled={busy}
                  onChange={(e) => {
                    clear();
                    setIncludeHospitals(e.target.checked);
                  }}
                />
                Include Bengaluru hospitals
              </label>
              {includeHospitals && (
                <>
                  <p className="helper">
                    Default: central Bengaluru. Edit coordinates to compare
                    straight-line distances. This directory covers three listed
                    hospitals only.
                  </p>
                  <div className="coordinates">
                    <label>
                      Latitude
                      <input
                        type="number"
                        step="any"
                        min="-90"
                        max="90"
                        required
                        value={latitude}
                        disabled={busy}
                        onChange={(e) => {
                          clear();
                          setLatitude(e.target.value);
                        }}
                      />
                    </label>
                    <label>
                      Longitude
                      <input
                        type="number"
                        step="any"
                        min="-180"
                        max="180"
                        required
                        value={longitude}
                        disabled={busy}
                        onChange={(e) => {
                          clear();
                          setLongitude(e.target.value);
                        }}
                      />
                    </label>
                  </div>
                </>
              )}
              {error && (
                <p className="error-banner" role="alert">
                  {error}
                </p>
              )}
              <button
                type="submit"
                className="primary full"
                disabled={busy || !model}
              >
                View disease candidates →
              </button>
              <p className="helper">
                Inputs are sent to this app’s API for calculation. Prediction
                records are not saved.
              </p>
            </aside>
          </form>
          <p className="clinical-note">
            Do not use this assessment for emergencies or to rule out disease.
            Seek professional care for real health concerns.
          </p>
        </>
      )}
      {screen === 'results' && (
        <>
          <div className="page-title">
            <div>
              <p className="eyebrow">02 / ASSESSMENT RESULTS</p>
              <h1>Disease candidates</h1>
              <p>Model rankings for the symptoms you selected.</p>
            </div>
            <button
              className="secondary"
              onClick={() => navigate('assessment')}
            >
              Edit symptoms
            </button>
          </div>
          {busy && (
            <section className="panel result-empty" role="status">
              <div className="loading-ring" />
              <h2>Comparing symptom evidence</h2>
              <p>Running the model and calculating hospital distances…</p>
            </section>
          )}
          {error && (
            <section className="panel error-banner" role="alert">
              <h2>The assessment could not finish</h2>
              <p>{error}</p>
              <button
                className="secondary"
                onClick={() => navigate('assessment')}
              >
                Return to assessment
              </button>
            </section>
          )}
          {!busy && !result && !error && (
            <section className="panel result-empty">
              <h2>No assessment yet</h2>
              <p>
                Complete a symptom assessment to see ranked disease candidates
                here. Results clear when the page is reloaded.
              </p>
              <button
                className="primary"
                onClick={() => navigate('assessment')}
              >
                Start assessment →
              </button>
            </section>
          )}
          {result && !busy && (
            <>
              <div className="research-notice">
                <strong>Research result — not a diagnosis</strong>
                <p>
                  {result.notice} The model can miss serious conditions. A high
                  weight is not clinical confidence.
                </p>
              </div>
              <div className="results-layout">
                <section className="panel">
                  <div className="panel-heading">
                    <h2>Top 5 candidates</h2>
                    <span className="pill">
                      {result.evidenceLevel === 'limited'
                        ? 'LIMITED SYMPTOM INPUT'
                        : 'RESEARCH RANKING'}
                    </span>
                  </div>
                  <p className="helper">
                    Weights are normalized across all {model?.conditions.length}{' '}
                    modeled categories. They are not your chance of having a
                    disease.
                  </p>
                  <ol className="candidate-list">
                    {ranked.map((c, i) => (
                      <li key={c.label}>
                        <span className="candidate-rank">
                          {String(i + 1).padStart(2, '0')}
                        </span>
                        <div className="candidate-main">
                          <div className="candidate-title">
                            <h3>{c.label}</h3>
                            <span>
                              {pct(c.score)} <small>model weight</small>
                            </span>
                          </div>
                          <progress
                            max={1}
                            value={c.score}
                            aria-label={c.label + ' model weight'}
                          />
                          <p>
                            Catalogue matches:{' '}
                            {c.matchedSymptoms.length
                              ? c.matchedSymptoms
                                  .map((id) => symptomLabels[id])
                                  .join(' · ')
                              : 'No direct catalogue match among the selected symptoms'}
                          </p>
                          <span className="icd">ICD-10 {c.icd10}</span>
                        </div>
                      </li>
                    ))}
                  </ol>
                </section>
                <aside className="panel result-summary">
                  <span className="eyebrow">ASSESSMENT SNAPSHOT</span>
                  <h2>{result.selectedSymptoms.length} symptoms</h2>
                  <div className="static-chips">
                    {result.selectedSymptoms.map((id) => (
                      <span key={id}>{symptomLabels[id]}</span>
                    ))}
                  </div>
                  <hr />
                  <p>
                    Unchecked symptoms were treated as unknown. Age, history,
                    symptom duration and examination findings were not
                    considered.
                  </p>
                  <p className="helper">
                    Calculated {new Date(result.createdAt).toLocaleString()}
                    <br />
                    Stored in this tab’s memory only.
                  </p>
                  <button className="secondary full" onClick={download}>
                    Download research report
                  </button>
                </aside>
              </div>
              <div className="section-title">
                <div>
                  <p className="eyebrow">HOSPITAL DIRECTORY</p>
                  <h2>
                    {result.rankingIncluded
                      ? 'Listed hospitals by distance'
                      : 'Hospital ranking is off'}
                  </h2>
                </div>
                <button
                  className="text-button"
                  onClick={() => navigate('hospitals')}
                >
                  Browse directory →
                </button>
              </div>
              {result.rankingIncluded ? (
                <>
                  <p className="helper">
                    Distance order only. This is not a treatment recommendation
                    or confirmation of current services or availability.
                  </p>
                  <HospitalCards hospitals={result.hospitals} />
                </>
              ) : (
                <p>
                  Enable hospital distances in your assessment to compare listed
                  facilities.
                </p>
              )}
            </>
          )}
        </>
      )}
      {screen === 'hospitals' && (
        <>
          <div className="page-title">
            <div>
              <p className="eyebrow">03 / BENGALURU DIRECTORY</p>
              <h1>Explore listed hospitals.</h1>
              <p>Public listings with source links and mapped locations.</p>
            </div>
            <span className="pill">{hospitals.length} LISTED FACILITIES</span>
          </div>
          <section className="directory-banner">
            <div>
              <h2>A place to begin your search.</h2>
              <p>
                Review the official listing and contact the hospital to confirm
                services, hours and availability.
              </p>
            </div>
            <img
              src="/images/hospital-atrium.png"
              alt="Illustrative hospital interior"
            />
            <span className="image-caption">
              Illustrative interior; not a listed facility
            </span>
          </section>
          <div className="directory-toolbar">
            <label>
              Search directory
              <input
                type="search"
                value={hospitalQuery}
                onChange={(e) => setHospitalQuery(e.target.value)}
                placeholder="Hospital name or area"
              />
            </label>
            <p>
              {result?.rankingIncluded
                ? 'Sorted by distance from assessment coordinates.'
                : 'Complete an assessment to compare distances.'}
            </p>
          </div>
          <HospitalCards hospitals={directory} />
          {!directory.length && (
            <p className="panel">
              {hospitals.length
                ? 'No hospitals match your search.'
                : 'Loading hospital directory…'}
            </p>
          )}
          <p className="helper">
            Map data ©{' '}
            <a
              href="https://www.openstreetmap.org/copyright"
              target="_blank"
              rel="noreferrer"
            >
              OpenStreetMap contributors
            </a>{' '}
            (ODbL). This is a small curated directory, not a complete
            nearby-hospital search. No appointment booking or live availability
            is provided.
          </p>
        </>
      )}
      {screen === 'about' && (
        <>
          <div className="page-title">
            <div>
              <p className="eyebrow">04 / MODEL & SOURCES</p>
              <h1>Understand the evidence.</h1>
              <p>Transparent data, measured evaluation, and clear limits.</p>
            </div>
          </div>
          {model ? (
            <>
              <section className="panel">
                <span className="eyebrow">DDXPLUS RESEARCH DATASET</span>
                <h2>Real disease names. Medically simulated cases.</h2>
                <p>
                  {model.dataset}. The model learns symptom frequencies from the
                  official training split. The official test split remains
                  separate. Only positive binary symptom evidence is used;
                  unchecked symptoms are unknown.
                </p>
                <a href={model.source} target="_blank" rel="noreferrer">
                  View dataset and CC BY 4.0 license ↗
                </a>
                <p className="helper">
                  Attribution: Arsene Fansi Tchango and colleagues, DDXPlus: A
                  New Dataset for Automatic Medical Diagnosis, NeurIPS 2022.
                  Adaptations: English binary symptom subset, shortened
                  interface labels, positive-evidence Naive Bayes model.
                </p>
              </section>
              <div className="metric-grid">
                <div className="metric">
                  <span>Training cases</span>
                  <strong>{model.trainRows.toLocaleString()}</strong>
                  <small>Official simulated training split</small>
                </div>
                <div className="metric">
                  <span>Test top-1 accuracy</span>
                  <strong>{pct(model.holdoutAccuracy)}</strong>
                  <small>All available binary symptoms</small>
                </div>
                <div className="metric">
                  <span>Test top-3 accuracy</span>
                  <strong>{pct(model.top3Accuracy)}</strong>
                  <small>
                    {model.testRows.toLocaleString()} nonempty test cases
                  </small>
                </div>
                <div className="metric">
                  <span>Three-symptom top-1</span>
                  <strong>{pct(model.threeSymptomAccuracy)}</strong>
                  <small>Random three-feature subset</small>
                </div>
              </div>
              <section className="panel">
                <h2>What these numbers do not establish</h2>
                <p>
                  This is not clinically validated. Evaluation on simulated
                  cases does not establish accuracy for real people. The model
                  excludes medical history, age, examination and non-binary
                  evidence. More selected symptoms do not guarantee a correct
                  result. Diseases outside the {model.conditions.length}
                  -category dataset cannot be identified.
                </p>
                <p>
                  Macro F1: {model.holdoutMacroF1.toFixed(3)}. Three-symptom
                  top-3: {pct(model.threeSymptomTop3)}. Model:{' '}
                  <code>{model.version}</code>.
                </p>
                <p>{model.privacy}</p>
              </section>
              <section className="panel condition-catalogue">
                <div className="panel-heading">
                  <h2>Disease catalogue</h2>
                  <span className="pill">
                    {model.conditions.length} CATEGORIES
                  </span>
                </div>
                <label>
                  Search disease names
                  <input
                    type="search"
                    value={conditionQuery}
                    onChange={(e) => setConditionQuery(e.target.value)}
                    placeholder="Search influenza, bronchitis…"
                  />
                </label>
                <div className="condition-list">
                  {model.conditions
                    .filter((c) =>
                      c.name
                        .toLowerCase()
                        .includes(conditionQuery.toLowerCase()),
                    )
                    .map((c) => (
                      <div key={c.name}>
                        <button
                          className="condition-toggle"
                          aria-expanded={openCondition === c.name}
                          onClick={() =>
                            setOpenCondition(
                              openCondition === c.name ? '' : c.name,
                            )
                          }
                        >
                          <strong>{c.name}</strong>
                          <span>
                            ICD-10 {c.icd10}{' '}
                            {openCondition === c.name ? '−' : '+'}
                          </span>
                        </button>
                        {openCondition === c.name && (
                          <p className="helper">
                            Binary symptoms listed in the source catalogue:{' '}
                            {c.symptoms
                              .map((id) => symptomLabels[id])
                              .join(' · ')}
                            . A catalogue association does not diagnose a
                            condition.
                          </p>
                        )}
                      </div>
                    ))}
                </div>
              </section>
              <section className="panel">
                <h2>Sources & credits</h2>
                <ul className="source-list">
                  <li>
                    <a
                      href="https://github.com/mila-iqia/ddxplus"
                      target="_blank"
                      rel="noreferrer"
                    >
                      DDXPlus dataset documentation
                    </a>{' '}
                    · data schema and research limitations
                  </li>
                  <li>
                    <a
                      href="https://www.openstreetmap.org/copyright"
                      target="_blank"
                      rel="noreferrer"
                    >
                      OpenStreetMap contributors
                    </a>{' '}
                    · hospital coordinates, ODbL
                  </li>
                  <li>
                    <a
                      href="https://bengaluruurban.nic.in/en/healthdept/"
                      target="_blank"
                      rel="noreferrer"
                    >
                      Bengaluru Urban district
                    </a>{' '}
                    · hospital listings
                  </li>
                  <li>
                    <a
                      href="https://www.nhs.uk/symptoms/shortness-of-breath/"
                      target="_blank"
                      rel="noreferrer"
                    >
                      NHS symptom guidance
                    </a>{' '}
                    · emergency context; follow your local emergency service
                  </li>
                  <li>
                    Hospital atrium image: generated illustration of an
                    imaginary facility. It is not a photograph of any listed
                    hospital.
                  </li>
                </ul>
              </section>
            </>
          ) : (
            <p>Loading model documentation…</p>
          )}
        </>
      )}
    </AppShell>
  );
}
