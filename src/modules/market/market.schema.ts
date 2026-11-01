import z from "zod";

export const marketSchema = z.object({
  title: z
    .string()
    .trim()
    .min(10, "Market title must contain at least 10 characters")
    .max(100, "Market title cannot exceed 100 characters"),

  description: z
    .string()
    .trim()
    .min(10, "Market description must contain at least 10 characters")
    .optional(),

  tradingStartsAt: z.coerce.date(),

  tradingEndsAt: z.coerce.date(),

  expiresAt: z.coerce.date(),
}).refine(
  (data) => data.tradingEndsAt > data.tradingStartsAt,
  {
    message: "Trading end time must be after trading start time",
    path: ["tradingEndsAt"],
  }
).refine(
  (data) => data.expiresAt >= data.tradingEndsAt,
  {
    message: "Market expiry must be after trading end time",
    path: ["expiresAt"],
  }
);