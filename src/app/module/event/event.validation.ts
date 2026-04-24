import { z } from "zod";

// --- ১. CREATE EVENT SCHEMA ---
export const createEventSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  date: z.preprocess((arg) => {
    if (typeof arg === "string") return new Date(arg);
    return arg;
  }, z.date()), 
  time: z.string(),
  venue: z.string(),
  isPublic: z.preprocess((val) => {
    if (typeof val === "string") return val === "true";
    if (typeof val === "boolean") return val;
    return false;
  }, z.boolean()),

  fee: z.coerce.number().nonnegative("Fee cannot be negative"),

  totalSeats: z.coerce.number().int().nonnegative("Total seats must be a positive number").default(0),


  image: z.preprocess((val) => {
    if (!val || val === "" || val === "undefined") return null;
    return val;
  }, z.any().optional()), 
});

// --- ২. UPDATE EVENT SCHEMA ---

export const updateEventSchema = z
  .object({
    title: z.string().min(3).optional(),
    description: z.string().min(10).optional(),
    date: z.string().optional(),
    time: z.string().optional(),
    venue: z.string().optional(),
    
    isPublic: z.preprocess((val) => {
      if (typeof val === "string") return val === "true";
      if (typeof val === "undefined") return undefined;
      return val;
    }, z.boolean().optional()),

    fee: z.coerce.number().nonnegative().optional(),

  
    totalSeats: z.coerce.number().int().nonnegative().optional(),
    
    image: z.preprocess((val) => {
      if (val === undefined) return undefined;
      if (!val || val === "" || val === "undefined") return null;
      return val;
    }, z.any().optional()), 
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  });

// --- ৩. FILTERS SCHEMA ---
export const filterEventsSchema = z.object({
  type: z.enum(["public", "private"]).optional(),
  fee: z.enum(["free", "paid"]).optional(),
});

// Types Export
export type CreateEventInput = z.infer<typeof createEventSchema>;
export type UpdateEventInput = z.infer<typeof updateEventSchema>;
export type FilterEventsInput = z.infer<typeof filterEventsSchema>;