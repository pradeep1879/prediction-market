import z from "zod";

export const marketSchema = z.object({
  title: z.string().min(10, "Market title at least include 10 character"),
  description: z.string().min(10, "Market description at least include 10 character").optional()
})