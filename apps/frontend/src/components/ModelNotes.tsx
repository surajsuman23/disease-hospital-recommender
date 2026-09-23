import type { ModelMetadata } from '../../../../packages/contracts/src/index';
export function ModelNotes({ model }: { model: ModelMetadata | null }) {
  return (
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
              The labels have no medical meaning. Low test performance is shown
              honestly; this model must not be used for healthcare decisions.
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
  );
}
