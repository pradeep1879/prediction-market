import z from "zod";

export const splitSchema = z.object({
  quantity: z.number().int().min(1, "Quantity must be at least 1"),
});

export const mergeSchema = z.object({
  quantity: z.number().int().min(1, "Quantity must be at least 1"),
});