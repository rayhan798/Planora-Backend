import { z } from "zod";

export const createInvitationSchema = z.object({
  eventId: z.number(),
  receiverId: z.number(),
});

export const updateInvitationSchema = z.object({
  status: z.enum(["ACCEPTED", "DECLINED", "REJECTED"]),
});