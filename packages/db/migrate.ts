import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import pg from "pg";
import "dotenv/config";

// Ensure we have a database URL
if (!process.env.DATABASE_URL) {
	console.error("DATABASE_URL environment variable is required");
	process.exit(1);
}

async function runMigrations() {
	console.log("Starting database migrations...");

	const pool = new pg.Pool({
		connectionString: process.env.DATABASE_URL,
	});

	try {
		const db = drizzle(pool);
		console.log("Connected to PostgreSQL database");
		await migrate(db, { migrationsFolder: "./drizzle" });
		console.log("Migrations completed successfully");
	} catch (error) {
		console.error("Migration failed:", error);
		process.exit(1);
	} finally {
		await pool.end();
		console.log("Database connection closed");
	}
}

runMigrations().catch((err) => {
	console.error("Unhandled error:", err);
	process.exit(1);
});
