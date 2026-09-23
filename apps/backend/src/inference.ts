import model from '../../../ml/artifacts/model.json';
import directory from '../../../ml/artifacts/hospitals.json';
import conditionData from '../../../ml/data/ddxplus/conditions.json';
import {
  SYMPTOMS,
  symptomCatalogue,
  type ModelMetadata,
  type Hospital,
} from '../../../packages/contracts/src/index';
const conditions = conditionData as Record<
  string,
  { 'icd10-id': string; symptoms: Record<string, unknown> }
>;
if (
  model.features.join(',') !== SYMPTOMS.join(',') ||
  model.clinicalUse !== false
)
  throw new Error('Model catalogue mismatch');
export const hospitals = directory as Hospital[];
export function infer(symptoms: readonly string[]) {
  if (symptoms.some((s) => !model.features.includes(s)))
    throw new Error('Unknown feature');
  const indices = symptoms.map((s) => model.features.indexOf(s));
  // Unchecked features are UNKNOWN; include positive evidence only.
  const logits = model.classes.map(
    (_, k) =>
      model.classLogPrior[k] +
      indices.reduce((sum, j) => sum + model.featureLogProbability[k][j], 0),
  );
  const max = Math.max(...logits);
  const weights = logits.map((v) => Math.exp(v - max));
  const total = weights.reduce((a, b) => a + b, 0);
  const scores = model.classes.map((label, k) => ({
    label,
    score: weights[k] / total,
    matchedSymptoms: symptoms.filter((s) => s in conditions[label].symptoms),
    icd10: conditions[label]['icd10-id'],
  }));
  return { label: scores[logits.indexOf(max)].label, scores };
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
  _label: string,
  location: { latitude: number; longitude: number },
  limit: number,
) {
  return hospitals
    .map((h) => ({
      ...h,
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
  name: 'Arovia disease research',
  version: model.version,
  demoOnly: true,
  algorithm: model.algorithm,
  symptoms: symptomCatalogue,
  conditions: model.classes.map((name) => ({
    name,
    icd10: conditions[name]['icd10-id'],
    symptoms: Object.keys(conditions[name].symptoms).filter((s) =>
      SYMPTOMS.includes(s),
    ),
  })),
  dataset: model.dataset,
  source: model.source,
  ...model.evaluation,
  privacy:
    'Inputs are processed for this response and are not saved as prediction records. The application keeps the current result only in page memory. Hosting access logs may contain request metadata.',
  notice:
    'Research candidates from simulated DDXPlus cases. Real disease names; not a diagnosis or calibrated disease probability. Conditions outside the dataset are not considered.',
};
