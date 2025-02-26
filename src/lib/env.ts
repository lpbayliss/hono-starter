import { z } from "zod";
import "dotenv/config";

const envSchema = z.object({
	APP_NAME: z.string(),
	NODE_ENV: z
		.enum(["development", "test", "production"])
		.default("development"),
	PORT: z.string().transform(Number),

	POSTGRES_USER: z.string(),
	POSTGRES_PASSWORD: z.string(),
	POSTGRES_DB: z.string(),
	POSTGRES_PORT: z.string().transform(Number),

	BETTER_AUTH_SECRET: z.string(),
	BETTER_AUTH_URL: z.string(),
});

const env = envSchema.safeParse(process.env);

if (!env.success) {
	console.error("❌ Invalid environment variables:", env.error.format());
	throw new Error("Invalid environment variables");
}

export default {
	...env.data,
	DATABASE_URL: `postgresql://${env.data.POSTGRES_USER}:${env.data.POSTGRES_PASSWORD}@localhost:${env.data.POSTGRES_PORT}/${env.data.POSTGRES_DB}`,
};
