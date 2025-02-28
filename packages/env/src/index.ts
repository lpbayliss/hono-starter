import { z } from "zod";
import "dotenv/config";

const envSchema = z.object({
	APP_NAME: z.string(),
	NODE_ENV: z
		.enum(["development", "test", "production"])
		.default("development"),
	PORT: z.string().transform(Number),
	WEB_URL: z.string(),
	API_URL: z.string(),

	POSTGRES_USER: z.string(),
	POSTGRES_PASSWORD: z.string(),
	POSTGRES_DB: z.string(),
	POSTGRES_PORT: z.string().transform(Number),
	DATABASE_URL: z.string(),

	BETTER_AUTH_SECRET: z.string(),
	BETTER_AUTH_URL: z.string(),

	GITHUB_CLIENT_ID: z.string(),
	GITHUB_CLIENT_SECRET: z.string(),
});

const env = envSchema.safeParse(process.env);

if (!env.success) {
	console.error("❌ Invalid environment variables:", env.error.format());
	throw new Error("Invalid environment variables");
}

export default env.data;
