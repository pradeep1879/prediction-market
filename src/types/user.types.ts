import { password } from "bun";
import z, { email } from "zod";

export const userSignUp = z.object({
  email: z.string().email(),
  password: z.string().min(8, "Password must contain 8 character").max(18),
  balance: z.number()
})


export const userSignIn = z.object({
  email: z.string().email(),
  password: z.string()
})