import { z } from "zod";

export const createReviewSchema = z.object({
  eventId: z.number(),
  userId: z.number(),
  rating: z.number().min(1).max(5),
  comment: z.string().optional(),
});

export const updateReviewSchema = z.object({
  rating: z.number().min(1).max(5).optional(),
  comment: z.string().optional(),
});