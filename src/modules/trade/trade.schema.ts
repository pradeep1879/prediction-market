import z, { output } from "zod";

export const getUserTradesSchema = z.object({
  outcome: z.enum(["YES", "NO"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10)
})