// src/modules/contact/contact.validation.ts
import { z } from "zod";

const createContactZodSchema = z.object({
  body: z.object({ 
    name: z.string().min(1, "Name is required"), 
    email: z.string().min(1, "Email is required").email("Invalid email"),
    subject: z.string().min(1, "Subject is required"),
    message: z.string().min(10, "Message must be at least 10 characters").max(1000),
  }),
});

export const ContactValidation = {
  createContactZodSchema,
};