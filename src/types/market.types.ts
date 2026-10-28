import z from "zod"

const resolutionSchema = z.enum(["YES", "NO"])
const betType = z.enum(["YES", "NO"])

export const marketSchema = z.object({
  title: z.string().min(10).max(20),
  initialWager: z.number().min(100).max(500),
  bet: betType,
  expiry: z.date(),
  resolution: resolutionSchema
})