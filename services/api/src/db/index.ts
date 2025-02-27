import "dotenv/config";
import env from "@acme/env";
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";

import * as schema from "./schema.js"; // Import your schema definitions

// Singleton pattern for database connection
let poolInstance: pg.Pool | null = null;
let drizzleInstance: ReturnType<typeof drizzle<typeof schema>> | null = null;

/**
 * Gets or creates a PostgreSQL connection pool
 */
export function getPool(): pg.Pool {
	if (!poolInstance) {
		poolInstance = new pg.Pool({
			connectionString: env.DATABASE_URL,
			// Configure pool settings for production use
			max: 20, // Maximum number of clients
			idleTimeoutMillis: 30000, // How long a client is allowed to remain idle
			connectionTimeoutMillis: 5000, // How long to wait for a connection
		});

		// Handle pool errors
		poolInstance.on("error", (err) => {
			console.error("Unexpected error on idle client", err);
		});

		console.log("PostgreSQL connection pool initialized");
	}

	return poolInstance;
}

/**
 * Gets or creates a Drizzle ORM instance
 */
export function getDb() {
	if (!drizzleInstance) {
		const pool = getPool();
		drizzleInstance = drizzle(pool, { schema });
	}

	return drizzleInstance;
}

/**
 * Gracefully shut down the database connection pool
 */
export async function closeDb() {
	if (poolInstance) {
		await poolInstance.end();
		poolInstance = null;
		drizzleInstance = null;
		console.log("Database connections closed");
	}
}

// Make sure to close the pool when the process exits
process.on("SIGINT", async () => {
	console.log("Received SIGINT signal, shutting down...");
	await closeDb();
	process.exit(0);
});

process.on("SIGTERM", async () => {
	console.log("Received SIGTERM signal, shutting down...");
	await closeDb();
	process.exit(0);
});
