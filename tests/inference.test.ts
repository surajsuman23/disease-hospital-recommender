import { expect, it } from 'vitest';
import fixtures from './fixtures/model-parity.json';
import {
  infer,
  haversineKm,
  rankHospitals,
} from '../apps/backend/src/inference';
it('matches scikit-learn labels and probabilities for all 256 binary patterns', () => {
  for (const fixture of fixtures) {
    const result = infer(fixture.symptoms);
    expect(result.label).toBe(fixture.label);
    result.scores.forEach((score, i) =>
      expect(score.score).toBeCloseTo(fixture.probabilities[i], 12),
    );
    expect(
      result.scores.reduce((total, score) => total + score.score, 0),
    ).toBeCloseTo(1, 12);
  }
});
it('ranks supported facilities and handles geographic boundaries', () => {
  expect(haversineKm(0, 0, 0, 0)).toBe(0);
  expect(haversineKm(0, 0, 0, 1)).toBeCloseTo(111.195, 2);
  expect(haversineKm(0, 179, 0, -179)).toBeCloseTo(222.39, 2);
  expect(() => haversineKm(91, 0, 0, 0)).toThrow();
  const ranked = rankHospitals(
    'demo_condition_c',
    { latitude: 12.94, longitude: 77.58 },
    3,
  );
  expect(ranked[0].name).toBe('Fictional Demo Hospital B');
  expect(ranked[0].distanceKm).toBe(0);
  expect(ranked.map((h) => h.name)).not.toContain('Fictional Demo Hospital A');
});
