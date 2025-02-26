import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { compress } from "hono/compress";
import { cors } from "hono/cors";
import { logger as honoLogger } from "hono/logger";
import { poweredBy } from "hono/powered-by";
import { prometheus } from "@hono/prometheus";
import { trpcServer } from "@hono/trpc-server";

import { health, posts } from "~/routes/index.js";
import { appRouter } from "~/rpc/app.js";
import env from "~/lib/env.js";
import logger from "~/lib/logger.js";

const app = new Hono();

const { printMetrics, registerMetrics } = prometheus();

app.use("*", registerMetrics);
app.get("/metrics", printMetrics);

app.use(poweredBy());
app.use(honoLogger((str, ...rest) => logger.info(str, ...rest)));
app.use(compress());
app.use("/api/*", cors());
app.route("/api/health", health);
app.route("/api/posts", posts);
app.use(
	"/trpc/*",
	trpcServer({
		router: appRouter,
	}),
);

const startServer = async () => {
	const server = serve(
		{
			fetch: app.fetch,
			port: env.PORT,
		},
		(info) => {
			console.log(`Server is running on http://localhost:${info.port}`);
		},
	);

	const shutdown = async (signal: string) => {
		logger.info(`Received ${signal}. Closing server...`);

		try {
			// Cleanup tasks... add here!

			logger.info("Closing server...");
			server.close(async () => {
				logger.info("Server closed successfully.");
				await new Promise((resolve) => logger.flush(resolve));
				process.exit(0);
			});
		} catch (error) {
			logger.error("Error during shutdown:", error);
			await new Promise((resolve) => logger.flush(resolve));
			process.exit(1);
		}
	};

	return { server, shutdown };
};

export default app;
export { startServer };
