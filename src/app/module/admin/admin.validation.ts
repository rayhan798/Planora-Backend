import { z } from "zod";

// ID param validation
export const idParamSchema = z.object({
  id: z.string().regex(/^\d+$/, "Invalid ID format"),
});

export type IdParamInput = z.infer<typeof idParamSchema>;