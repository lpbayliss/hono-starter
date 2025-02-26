import { z } from "zod";
import "dotenv/config";

const envSchema = z.object({
	PORT: z.coerce.number().default(5001),
	NODE_ENV: z
		.enum(["development", "production", "test"])
		.default("development"),
	DATABASE_URL: z.string(),
});

const env = envSchema.parse(process.env);

export default env;
