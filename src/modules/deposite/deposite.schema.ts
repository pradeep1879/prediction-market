import z from "zod";

export const depositeSchema = z.object({
  amount: z.number()
            .min(1, "Deposite can't be less than 1")
            .max(1000, "Deposite amount can't be greater than 1000")
})