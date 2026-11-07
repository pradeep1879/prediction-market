import z from "zod";

export const placeOrderSchema = z.object({
  marketId: z.string().min(1),
  outcome: z.enum(["YES", "NO"]),
  action: z.enum(["BUY", "SELL"]),
  price: z.number().int().positive(),
  quantity: z.number().int().positive(),
  timeInForce: z.enum(["GTC", "IOC", "FOK"]).default("GTC"),
});