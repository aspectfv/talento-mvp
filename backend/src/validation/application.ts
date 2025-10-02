import { z } from 'zod';

const applicationStatus = ['applied', 'shortlisted', 'rejected'] as const;

export const createApplicationSchema = z.object({
  body: z.object({
    job_id: z.number().int().positive(),
  }),
});

export const getApplicationByIdSchema = z.object({
  params: z.object({
    id: z.string().refine(val => /^\d+$/.test(val), {
      message: 'ID must be a positive integer.',
    }),
  }),
});

export const updateApplicationSchema = z.object({
  params: z.object({
    id: z.string().refine(val => /^\d+$/.test(val), {
      message: 'ID must be a positive integer.',
    }),
  }),
  body: z.object({
    status: z.enum(applicationStatus),
  }),
});

export default {
  createApplicationSchema,
  getApplicationByIdSchema,
  updateApplicationSchema,
};
