import z from "zod"

const resolutionSchema = z.enum(["YES", "NO"])
const betType = z.enum(["YES", "NO"])

export const marketSchema = z.object({
  title: z.string().min(10).max(50),
  initialWager: z.number().min(100).max(500),
  expiry: z.coerce.date().refine(
    (date) => date > new Date(),
    { message: "Expiry must be in the future" }
  ),
  resolution: resolutionSchema,
  bet: betType,
})

