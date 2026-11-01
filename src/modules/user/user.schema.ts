import z from "zod";

export const userSignUp = z.object({
  username: z.string(),
  password: z
    .string()
    .min(8, "Password must contain at least 8 characters")
    .max(18, "Password cannot exceed 18 characters"),
});

export const userSignIn = z.object({
  username: z.string(),
  password: z.string()
})


