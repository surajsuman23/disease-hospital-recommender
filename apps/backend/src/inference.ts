import model from '../../../ml/artifacts/model.json';
import hospitals from '../../../ml/artifacts/hospitals.json';
import {
  SYMPTOMS,
  symptomLabels,
  type ModelMetadata,
} from '../../../packages/contracts/src/index';

if (
  model.features.join(',') !== SYMPTOMS.join(',') ||
  model.algorithm !== 'BernoulliNB' ||
  model.clinicalUse !== false
) {
  throw new Error(
    'Unsupported model artifact. Re-export and validate before serving.',
  );
}
export function infer(symptoms: readonly string[]) {
  const selected = new Set(symptoms);
  if (symptoms.some((s) => !model.features.includes(s)))
    throw new Error('Unknown feature');
  const logScores = model.classes.map(
    (_, k) =>
      model.classLogPrior[k] +
      model.features.reduce((sum, feature, j) => {
        const logP = model.featureLogProbability[k][j];
        return (
          sum + (selected.has(feature) ? logP : Math.log1p(-Math.exp(logP)))
        );
      }, 0),
  );
  const maximum = Math.max(...logScores);
  const weights = logScores.map((score) => Math.exp(score - maximum));
  const total = weights.reduce((sum, value) => sum + value, 0);
  const scores = model.classes.map((label, index) => ({
    label,
    score: weights[index] / total,
  }));
  return { label: scores[logScores.indexOf(maximum)].label, scores };
}
export function haversineKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
) {
  if (
    ![lat1, lon1, lat2, lon2].every(Number.isFinite) ||
    Math.abs(lat1) > 90 ||
    Math.abs(lat2) > 90 ||
    Math.abs(lon1) > 180 ||
    Math.abs(lon2) > 180
  )
    throw new Error('Invalid coordinates');
  const rad = Math.PI / 180;
  const a =
    Math.sin(((lat2 - lat1) * rad) / 2) ** 2 +
    Math.cos(lat1 * rad) *
      Math.cos(lat2 * rad) *
      Math.sin(((lon2 - lon1) * rad) / 2) ** 2;
  return 6371.0088 * 2 * Math.asin(Math.sqrt(Math.min(1, Math.max(0, a))));
}
export function rankHospitals(
  label: string,
  location: { latitude: number; longitude: number },
  limit: number,
) {
  return hospitals
    .filter(
      (h) => h.conditions.split(';').includes(label) || h.conditions === 'all',
    )
    .map((h) => ({
      name: h.name,
      latitude: h.latitude,
      longitude: h.longitude,
      fictional: true as const,
      distanceKm:
        Math.round(
          haversineKm(
            location.latitude,
            location.longitude,
            h.latitude,
            h.longitude,
          ) * 1000,
        ) / 1000,
    }))
    .sort((a, b) => a.distanceKm - b.distanceKm || a.name.localeCompare(b.name))
    .slice(0, limit);
}
export const metadata: ModelMetadata = {
  name: 'Disease prediction demonstration',
  version: model.version,
  demoOnly: true,
  algorithm: model.algorithm,
  symptoms: SYMPTOMS.map((id) => ({ id, label: symptomLabels[id] })),
  dataset: model.dataset,
  holdoutAccuracy: model.evaluation.models.naive_bayes.test_accuracy,
  holdoutMacroF1: model.evaluation.models.naive_bayes.test_macro_f1,
  trainRows: model.evaluation.train_rows,
  testRows: model.evaluation.test_rows,
  privacy:
    'The API processes inputs to return a result. Application logs exclude symptoms, coordinates and request bodies. No prediction records are stored. Hosting-provider access logs may still record request metadata.',
  notice:
    'Synthetic educational demonstration. Condition labels and hospitals are fictional. This model is not suitable for diagnosis, treatment or choosing real care.',
};
