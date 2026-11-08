import z from "zod";

export const placeOrderSchema = z.object({
  outcome: z.enum(["YES", "NO"]),
  action: z.enum(["BUY", "SELL"]),
  price: z.number().int().positive(),
  quantity: z.number().int().positive(),
  timeInForce: z.enum(["GTC", "IOC", "FOK"]).default("GTC"),
});

export const getUserOrdersSchema = z.object({
  status: z.enum([
    "PENDING",
    "OPEN",
    "PARTIALLY_FILLED",
    "FILLED",
    "CANCELLED",
    "REJECTED",
    "EXPIRED"
  ]).optional(),
  outcome: z.enum(["YES", "NO"]).optional(),
  action:  z.enum(["BUY", "SELL"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10)
})