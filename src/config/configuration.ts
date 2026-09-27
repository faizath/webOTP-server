import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default(
    "development",
  ),
  PORT: z.coerce.number().int().positive().default(3000),
  DB_HOST: z.string().trim().min(1).optional(),
  DB_PORT: z.coerce.number().int().positive().default(1433),
  DB_USER: z.string().trim().min(1).default("sa"),
  DB_PASSWORD: z.string().min(1).default("YourStrong!Passw0rd"),
  DB_NAME: z.string().trim().min(1).default("webotp"),
  JWT_SECRET: z.string().min(1).default("development-only-change-me"),
  JWT_ACCESS_TTL: z.string().default("15m"),
  JWT_REFRESH_TTL: z.string().default("30d"),
  BCRYPT_ROUNDS: z.coerce.number().int().min(10).max(15).default(12),
});

export type AppConfig = z.infer<typeof envSchema>;

export function validateEnvironment(
  environment: Record<string, unknown>,
): AppConfig {
  const result = envSchema.safeParse(environment);
  if (!result.success) {
    throw new Error(
      `Invalid environment configuration: ${result.error.message}`,
    );
  }
  return result.data;
}

export function configuration(): AppConfig {
  return validateEnvironment(Deno.env.toObject());
}
