import { z } from 'zod';

const userRoles = ['seeker', 'admin', 'superadmin'] as const;

export const createUserSchema = z.object({
  body: z
    .object({
      email: z.email().optional(),
      password: z.string().min(6, 'Password must be at least 6 characters long').optional(),
      role: z.enum(userRoles).optional(),
      company_id: z.number().int().positive().optional(),
      messenger_psid: z.string().min(1).optional(),
      first_name: z.string().min(1).optional(),
      last_name: z.string().min(1).optional(),
    })
    .refine(data => (data.email && data.password && data.role) || data.messenger_psid, {
      message: 'Either email, password, and role are required, or a messenger_psid is required.',
      path: ['body'],
    }),
});

const commonUpdateBody = z
  .object({
    first_name: z.string().min(1, 'First name cannot be empty').optional(),
    last_name: z.string().min(1, 'Last name cannot be empty').optional(),
    university: z.string().optional(),
    skills: z.array(z.string()).optional(),
    interests: z.array(z.string()).optional(),
  })
  .refine(data => Object.keys(data).length > 0, {
    message: 'Update body cannot be empty',
  });

export const updateCurrentUserSchema = z.object({
  body: commonUpdateBody,
});

export const getUserByIdSchema = z.object({
  params: z.object({
    id: z.string().refine(val => /^\d+$/.test(val), {
      message: 'ID must be a positive integer.',
    }),
  }),
});

export const updateUserByIdSchema = z.object({
  body: commonUpdateBody,
  params: z.object({
    id: z.string().refine(val => /^\d+$/.test(val), {
      message: 'ID must be a positive integer.',
    }),
  }),
});
