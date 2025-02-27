import { randomUUID } from "node:crypto";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";

import env from "@acme/env";
import { getDb } from "~/db/index.js";

const db = getDb();

export const auth = betterAuth({
	database: drizzleAdapter(db, {
		provider: "pg",
	}),
	user: {
		additionalFields: {
			role: {
				type: "string",
				required: false,
				defaultValue: "user",
				input: false,
			},
		},
	},
	advanced: {
		generateId() {
			return randomUUID();
		},
	},
	socialProviders: {
		google: {
			clientId: env.GITHUB_CLIENT_ID,
			clientSecret: env.GITHUB_CLIENT_SECRET,
		},
	},
});
