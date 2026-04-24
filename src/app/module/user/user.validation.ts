import { z } from "zod";

// ---------------- Create User ----------------
export const createUserSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["USER", "ADMIN"]).optional(),
});

// TypeScript type inference for create
export type CreateUserInput = z.infer<typeof createUserSchema>;

// ---------------- Update User ----------------
export const updateUserSchema = z
  .object({
    name: z.string().min(3, "Name must be at least 3 characters").optional(),
    password: z.string().min(6, "Password must be at least 6 characters").optional(),
    bio: z.string().max(500, "Bio cannot exceed 500 characters").optional(), 
    image: z.string().optional(),
  })
  .refine((data) => data.name || data.password || data.bio || data.image, {
    message: "At least one field (name, password, bio, or image) must be provided",
  });

// TypeScript type inference for update
export type UpdateUserInput = z.infer<typeof updateUserSchema>;