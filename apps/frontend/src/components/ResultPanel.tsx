import {
  symptomLabels,
  type PredictionResponse,
} from '../../../../packages/contracts/src/index';
const labelName = (label: string) =>
  label
    .replace('demo_condition_', 'Demo condition ')
    .replace(/\b([abc])$/, (s) => s.toUpperCase());

type Props = {
  result: PredictionResponse | null;
  busy: boolean;
  error: string;
  download: () => void;
};
export function ResultPanel({ result, busy, error, download }: Props) {
  return (
    <section
      className="card result-card"
      aria-label="Prediction results"
      aria-busy={busy}
    >
      <div className="section-heading">
        <h2>Result overview</h2>
        <span className={`status ${result ? 'complete' : ''}`} role="status">
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
            These scores describe the synthetic classes. They are not disease
            probabilities or clinical confidence.
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
            <button type="button" className="text-button" onClick={download}>
              Download JSON
            </button>
          </div>
        </>
      )}
    </section>
  );
}
