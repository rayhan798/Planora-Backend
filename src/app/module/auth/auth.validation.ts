import { z } from 'zod';

const resendOtpZodSchema = z.object({
  body: z.object({
    email: z
      .string()
      .min(1, { message: 'Email is required' })
      .email('Invalid email address'),
  }),
});

export const AuthValidation = {
  resendOtpZodSchema,
};