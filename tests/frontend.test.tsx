// @vitest-environment jsdom
import React from 'react';
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { afterEach, expect, it, vi } from 'vitest';
import { App } from '../apps/frontend/src/App';
import { metadata, hospitals, infer } from '../apps/backend/src/inference';
import { getModel, getHospitals, predict } from '../apps/frontend/src/api';
vi.mock('../apps/frontend/src/api', () => ({
  getModel: vi.fn(),
  getHospitals: vi.fn(),
  predict: vi.fn(),
}));
afterEach(() => {
  cleanup();
  vi.resetAllMocks();
  location.hash = '';
});
function setup() {
  vi.mocked(getModel).mockResolvedValue(metadata);
  vi.mocked(getHospitals).mockResolvedValue(hospitals);
  window.scrollTo = vi.fn();
  render(<App />);
}
it('opens a dedicated result route with real disease names and clears changed inputs', async () => {
  const features = ['E_91', 'E_201', 'E_97', 'E_94', 'E_144'];
  vi.mocked(predict).mockResolvedValue({
    requestId: 'test',
    modelVersion: metadata.version,
    demoOnly: true,
    ...infer(features),
    hospitals: [],
    rankingIncluded: false,
    selectedSymptoms: features,
    notice: metadata.notice,
    evidenceLevel: 'expanded',
    createdAt: '2026-09-23T12:00:00Z',
  });
  setup();
  fireEvent.click(screen.getByRole('button', { name: 'Try an example' }));
  await waitFor(() =>
    expect(
      screen.getByRole('button', { name: 'View disease candidates →' }),
    ).toBeEnabled(),
  );
  fireEvent.click(
    screen.getByRole('button', { name: 'View disease candidates →' }),
  );
  await waitFor(() =>
    expect(
      screen.getByRole('heading', { name: 'Top 5 candidates' }),
    ).toBeInTheDocument(),
  );
  expect(location.hash).toBe('#/results');
  expect(screen.queryByText('Demo condition A')).not.toBeInTheDocument();
  expect(predict).toHaveBeenCalledOnce();
  fireEvent.click(screen.getByRole('button', { name: 'Edit symptoms' }));
  fireEvent.click(screen.getByLabelText('Cough'));
  fireEvent.click(screen.getByRole('link', { name: /Assessment results/ }));
  expect(
    screen.getByRole('heading', { name: 'No assessment yet' }),
  ).toBeInTheDocument();
});
it('blocks insufficient input and supports recovery from API failure', async () => {
  vi.mocked(predict).mockRejectedValue(new Error('Please try again.'));
  setup();
  fireEvent.click(screen.getByRole('button', { name: 'Start assessment' }));
  await waitFor(() =>
    expect(
      screen.getByRole('button', { name: 'View disease candidates →' }),
    ).toBeEnabled(),
  );
  fireEvent.click(
    screen.getByRole('button', { name: 'View disease candidates →' }),
  );
  expect(screen.getByRole('alert')).toHaveTextContent(
    'Select at least three symptoms',
  );
  fireEvent.click(screen.getByRole('button', { name: 'Load example' }));
  fireEvent.click(
    screen.getByRole('button', { name: 'View disease candidates →' }),
  );
  await waitFor(() =>
    expect(screen.getByRole('alert')).toHaveTextContent('Please try again.'),
  );
  expect(
    screen.getByRole('button', { name: 'Return to assessment' }),
  ).toBeEnabled();
});
