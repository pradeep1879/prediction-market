import z from "zod";

export const splitMergeSchema = z.object({
  quantity: z.number().min(1, "Quantity can't be less than 1.")
})