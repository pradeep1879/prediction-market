import z from "zod";

export const marketResoultionSchema = z.object({
  outcome: z.enum(["YES", "NO"]),
  resolutionSource: z.string().optional()
});