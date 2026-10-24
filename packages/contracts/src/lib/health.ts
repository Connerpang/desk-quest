import { z } from 'zod';

export const healthCheckStatusSchema = z.enum(['up', 'down']);

export const healthResponseSchema = z.object({
  status: z.enum(['ok', 'error']),
  checks: z.record(z.string(), healthCheckStatusSchema).optional(),
});

export type HealthResponse = z.infer<typeof healthResponseSchema>;
