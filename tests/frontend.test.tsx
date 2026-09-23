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
import { metadata } from '../apps/backend/src/inference';
import { getModel, predict } from '../apps/frontend/src/api';
vi.mock('../apps/frontend/src/api', () => ({
  getModel: vi.fn(),
  predict: vi.fn(),
}));
afterEach(() => {
  cleanup();
  vi.resetAllMocks();
});
it('submits selected features and coordinates, renders results and clears stale output', async () => {
  vi.mocked(getModel).mockResolvedValue(metadata);
  vi.mocked(predict).mockResolvedValue({
    requestId: 'test',
    modelVersion: metadata.version,
    demoOnly: true,
    label: 'demo_condition_a',
    scores: [{ label: 'demo_condition_a', score: 1 }],
    hospitals: [
      {
        name: 'Fictional Demo Hospital A',
        distanceKm: 1.553,
        latitude: 12.98,
        longitude: 77.6,
        fictional: true,
      },
    ],
    rankingIncluded: true,
    selectedSymptoms: ['fever', 'cough'],
    notice: metadata.notice,
  });
  render(<App />);
  await waitFor(() =>
    expect(
      screen.getByRole('button', { name: /Run demonstration/ }),
    ).toBeEnabled(),
  );
  fireEvent.click(screen.getByRole('button', { name: 'Use example' }));
  fireEvent.click(screen.getByRole('button', { name: /Run demonstration/ }));
  expect(
    await screen.findByText('Fictional Demo Hospital A'),
  ).toBeInTheDocument();
  expect(predict).toHaveBeenCalledWith({
    symptoms: ['fever', 'cough'],
    location: { latitude: 12.97, longitude: 77.59 },
    hospitalLimit: 3,
  });
  fireEvent.click(screen.getByLabelText('Fatigue'));
  expect(
    screen.queryByText('Fictional Demo Hospital A'),
  ).not.toBeInTheDocument();
});
it('blocks an empty selection and provides a recoverable API error', async () => {
  vi.mocked(getModel).mockResolvedValue(metadata);
  vi.mocked(predict).mockRejectedValue(new Error('Please try again.'));
  render(<App />);
  await waitFor(() =>
    expect(
      screen.getByRole('button', { name: /Run demonstration/ }),
    ).toBeEnabled(),
  );
  fireEvent.click(screen.getByRole('button', { name: /Run demonstration/ }));
  expect(screen.getByRole('alert')).toHaveTextContent(
    'Select at least one symptom',
  );
  expect(predict).not.toHaveBeenCalled();
  fireEvent.click(screen.getByLabelText('Fever'));
  fireEvent.click(screen.getByRole('button', { name: /Run demonstration/ }));
  await waitFor(() =>
    expect(screen.getByRole('alert')).toHaveTextContent('Please try again.'),
  );
  expect(
    screen.getByRole('button', { name: /Run demonstration/ }),
  ).toBeEnabled();
});
