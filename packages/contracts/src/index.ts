import { z } from 'zod';

export const SYMPTOMS = [
  'fever',
  'cough',
  'fatigue',
  'headache',
  'nausea',
  'rash',
  'sneezing',
  'body_ache',
] as const;
export const symptomLabels: Record<(typeof SYMPTOMS)[number], string> = {
  fever: 'Fever',
  cough: 'Cough',
  fatigue: 'Fatigue',
  headache: 'Headache',
  nausea: 'Nausea',
  rash: 'Rash',
  sneezing: 'Sneezing',
  body_ache: 'Body ache',
};
export const locationSchema = z
  .object({
    latitude: z.number().finite().min(-90).max(90),
    longitude: z.number().finite().min(-180).max(180),
  })
  .strict();
export const predictionRequestSchema = z
  .object({
    symptoms: z
      .array(z.enum(SYMPTOMS))
      .min(1)
      .max(8)
      .refine(
        (values) => new Set(values).size === values.length,
        'Choose each symptom only once.',
      ),
    location: locationSchema.optional(),
    hospitalLimit: z.number().int().min(1).max(4).default(3),
  })
  .strict();
export type PredictionRequest = z.input<typeof predictionRequestSchema>;
export const predictionResponseSchema = z.object({
  requestId: z.string(),
  modelVersion: z.string(),
  demoOnly: z.literal(true),
  label: z.string(),
  scores: z.array(
    z.object({ label: z.string(), score: z.number().min(0).max(1) }),
  ),
  hospitals: z.array(
    z.object({
      name: z.string(),
      distanceKm: z.number().nonnegative(),
      latitude: z.number(),
      longitude: z.number(),
      fictional: z.literal(true),
    }),
  ),
  rankingIncluded: z.boolean(),
  selectedSymptoms: z.array(z.enum(SYMPTOMS)),
  notice: z.string(),
});
export type PredictionResponse = z.infer<typeof predictionResponseSchema>;
export const metadataSchema = z.object({
  name: z.string(),
  version: z.string(),
  demoOnly: z.literal(true),
  algorithm: z.string(),
  symptoms: z.array(z.object({ id: z.enum(SYMPTOMS), label: z.string() })),
  dataset: z.string(),
  holdoutAccuracy: z.number(),
  holdoutMacroF1: z.number(),
  trainRows: z.number(),
  testRows: z.number(),
  privacy: z.string(),
  notice: z.string(),
});
export type ModelMetadata = z.infer<typeof metadataSchema>;
