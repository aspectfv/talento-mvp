import { z } from 'zod';

const employmentTypes = ['full-time', 'part-time', 'contract', 'internship'] as const;

export const createJobSchema = z.object({
  body: z.object({
    title: z.string().min(1, 'Title is required'),
    description: z.string().min(1, 'Description is required'),
    location: z.string().optional(),
    employment_type: z.enum(employmentTypes),
  }),
});

export const getAllJobsSchema = z.object({
  query: z.object({
    for_user_id: z.string().optional(), // For future matching logic
  }),
});

export const getJobByIdSchema = z.object({
  params: z.object({
    id: z.string().refine(val => /^\d+$/.test(val), {
      message: 'ID must be a positive integer.',
    }),
  }),
});

const updateJobBody = z
  .object({
    title: z.string().min(1).optional(),
    description: z.string().min(1).optional(),
    location: z.string().optional(),
    employment_type: z.enum(employmentTypes).optional(),
    is_active: z.boolean().optional(),
  })
  .refine(data => Object.keys(data).length > 0, {
    message: 'Update body cannot be empty',
  });

export const updateJobSchema = z.object({
  body: updateJobBody,
  params: z.object({
    id: z.string().refine(val => /^\d+$/.test(val), {
      message: 'ID must be a positive integer.',
    }),
  }),
});

export const deleteJobSchema = z.object({
  params: z.object({
    id: z.string().refine(val => /^\d+$/.test(val), {
      message: 'ID must be a positive integer.',
    }),
  }),
});

export const getApplicationsForJobSchema = z.object({
  params: z.object({
    job_id: z.string().refine(val => /^\d+$/.test(val), {
      message: 'Job ID must be a positive integer.',
    }),
  }),
  query: z.object({
    status: z.enum(['applied', 'shortlisted', 'rejected']).optional(),
  }),
});

export default {
  createJobSchema,
  getAllJobsSchema,
  getJobByIdSchema,
  updateJobSchema,
  deleteJobSchema,
  getApplicationsForJobSchema,
};
