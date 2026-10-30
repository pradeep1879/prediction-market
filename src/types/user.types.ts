import z from "zod";

export const userSignUp = z.object({
  email: z.email(),
  password: z.string().min(8, "Password must contain 8 character").max(18),
  balance: z.number()
})


export const userSignIn = z.object({
  email: z.email(),
  password: z.string()
})


export const userBalance = z.object({
  balance: z.number().min(0).max(1000)
})