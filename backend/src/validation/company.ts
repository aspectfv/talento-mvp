import { z } from 'zod';

export const createCompanySchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Company name is required'),
    website: z.url().optional(),
    description: z.string().optional(),
    logo_url: z.url().optional(),
  }),
});

export const getCompanyByIdSchema = z.object({
  params: z.object({
    id: z.string().refine(val => /^\d+$/.test(val), {
      message: 'ID must be a positive integer.',
    }),
  }),
});

const updateCompanyBody = z
  .object({
    name: z.string().min(1, 'Company name cannot be empty').optional(),
    website: z.url().optional(),
    description: z.string().optional(),
    logo_url: z.url().optional(),
  })
  .refine(data => Object.keys(data).length > 0, {
    message: 'Update body cannot be empty',
  });

export const updateCompanySchema = z.object({
  body: updateCompanyBody,
  params: z.object({
    id: z.string().refine(val => /^\d+$/.test(val), {
      message: 'ID must be a positive integer.',
    }),
  }),
});

export default {
  createCompanySchema,
  getCompanyByIdSchema,
  updateCompanySchema,
};
