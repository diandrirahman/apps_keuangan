import { z } from 'zod'

const envSchema = z.object({
  PORT: z.coerce.number().default(3000),
  CLIENT_ORIGIN: z.string().url().default('http://localhost:5173'),
  GEMINI_API_KEY: z.string().min(1).optional(),
  GEMINI_MODEL: z.string().default('gemini-3.5-flash-lite'),
})

export const env = envSchema.parse(process.env)
