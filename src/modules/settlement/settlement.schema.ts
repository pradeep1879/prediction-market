import z from "zod";

export const marketSettlementSchema = z.object({
  page: z.number(),
  limit: z.number()
})