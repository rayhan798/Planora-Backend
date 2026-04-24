import { z } from "zod";

export const createParticipationSchema = z.object({
  eventId: z.number(),
});