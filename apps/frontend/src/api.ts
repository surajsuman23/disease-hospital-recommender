import {
  metadataSchema,
  hospitalSchema,
  predictionResponseSchema,
  type PredictionRequest,
} from '../../../packages/contracts/src/index';
async function request(path: string, init?: RequestInit) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(path, {
      ...init,
      signal: controller.signal,
      credentials: 'same-origin',
    });
    const data = await response.json();
    if (!response.ok)
      throw new Error(
        data?.error?.message ?? 'The service is unavailable. Please try again.',
      );
    return data;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError')
      throw new Error('The request timed out. Please try again.');
    throw error;
  } finally {
    clearTimeout(timer);
  }
}
export const getModel = async () =>
  metadataSchema.parse(await request('/api/v1/model'));
export const predict = async (input: PredictionRequest) =>
  predictionResponseSchema.parse(
    await request('/api/v1/predictions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    }),
  );
export const getHospitals = async () => {
  const data = await request('/api/v1/hospitals');
  return hospitalSchema.array().parse(data.hospitals);
};
