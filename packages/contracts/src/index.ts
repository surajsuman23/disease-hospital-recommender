import { z } from 'zod';
import catalogue from '../symptoms.json';
export const symptomCatalogue = catalogue;
export const SYMPTOMS = catalogue.map((s) => s.id);
export const symptomLabels: Record<string, string> = Object.fromEntries(
  catalogue.map((s) => [s.id, s.label]),
);
const symptomId = z
  .string()
  .refine((s) => SYMPTOMS.includes(s), 'Unknown symptom');
export const locationSchema = z
  .object({
    latitude: z.number().finite().min(-90).max(90),
    longitude: z.number().finite().min(-180).max(180),
  })
  .strict();
export const predictionRequestSchema = z
  .object({
    symptoms: z
      .array(symptomId)
      .min(3, 'Select at least three symptoms.')
      .max(30)
      .refine(
        (v) => new Set(v).size === v.length,
        'Choose each symptom only once.',
      ),
    location: locationSchema.optional(),
    hospitalLimit: z.number().int().min(1).max(3).default(3),
  })
  .strict();
export type PredictionRequest = z.input<typeof predictionRequestSchema>;
export const hospitalSchema = z.object({
  id: z.string(),
  name: z.string(),
  address: z.string(),
  latitude: z.number(),
  longitude: z.number(),
  fictional: z.literal(false),
  website: z.string().url(),
  mapUrl: z.string().url(),
  area: z.string(),
  source: z.string(),
  verifiedOn: z.string(),
  distanceKm: z.number().nonnegative().optional(),
});
export type Hospital = z.infer<typeof hospitalSchema>;
export const predictionResponseSchema = z.object({
  requestId: z.string(),
  modelVersion: z.string(),
  demoOnly: z.literal(true),
  label: z.string(),
  scores: z.array(
    z.object({
      label: z.string(),
      score: z.number().min(0).max(1),
      matchedSymptoms: z.array(z.string()),
      icd10: z.string(),
    }),
  ),
  hospitals: z.array(hospitalSchema),
  rankingIncluded: z.boolean(),
  selectedSymptoms: z.array(symptomId),
  notice: z.string(),
  evidenceLevel: z.enum(['limited', 'expanded']),
  createdAt: z.string(),
});
export type PredictionResponse = z.infer<typeof predictionResponseSchema>;
export const metadataSchema = z.object({
  name: z.string(),
  version: z.string(),
  demoOnly: z.literal(true),
  algorithm: z.string(),
  symptoms: z.array(
    z.object({
      id: z.string(),
      label: z.string(),
      question: z.string(),
      group: z.string(),
      common: z.boolean(),
    }),
  ),
  conditions: z.array(
    z.object({
      name: z.string(),
      icd10: z.string(),
      symptoms: z.array(z.string()),
    }),
  ),
  dataset: z.string(),
  source: z.string().url(),
  holdoutAccuracy: z.number(),
  holdoutMacroF1: z.number(),
  top3Accuracy: z.number(),
  threeSymptomAccuracy: z.number(),
  threeSymptomTop3: z.number(),
  trainRows: z.number(),
  testRows: z.number(),
  privacy: z.string(),
  notice: z.string(),
});
export type ModelMetadata = z.infer<typeof metadataSchema>;
