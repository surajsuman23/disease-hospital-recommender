import { expect, it } from 'vitest';
import fixtures from './fixtures/model-parity.json';
import {
  infer,
  haversineKm,
  rankHospitals,
} from '../apps/backend/src/inference';
it('matches the Python positive-evidence ranker on 80 held-out DDXPlus cases', () => {
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
it('ranks real listings only by distance and handles geographic boundaries', () => {
  expect(haversineKm(0, 0, 0, 0)).toBe(0);
  expect(haversineKm(0, 0, 0, 1)).toBeCloseTo(111.195, 2);
  expect(haversineKm(0, 179, 0, -179)).toBeCloseTo(222.39, 2);
  expect(() => haversineKm(91, 0, 0, 0)).toThrow();
  const ranked = rankHospitals(
    'Influenza',
    { latitude: 12.9635035, longitude: 77.5737113 },
    3,
  );
  expect(ranked[0].name).toBe('Victoria Hospital');
  expect(ranked[0].distanceKm).toBe(0);
  expect(ranked.every((h) => h.fictional === false)).toBe(true);
  expect(
    rankHospitals(
      'Pneumonia',
      { latitude: 12.9635035, longitude: 77.5737113 },
      3,
    ),
  ).toEqual(ranked);
});
