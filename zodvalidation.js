import { z } from "zod";

export const signupZodSchema = z.object({
  name: z.string(),
  email: z.email(),
  password: z.string(),
  role: z.string(),
});

export const loginZodSchmea = z.object({
  email: z.email(),
  password: z.string(),
});

export const contestZodScehma = z.object({
  title: z.string(),
  description: z.string(),
  startTime: z.string(),
  endTime: z.string(),
});
