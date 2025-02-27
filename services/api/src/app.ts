import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { compress } from "hono/compress";
import { cors } from "hono/cors";
import { logger as honoLogger } from "hono/logger";
import { poweredBy } from "hono/powered-by";
import { prometheus } from "@hono/prometheus";
import { trpcServer } from "@hono/trpc-server";
import env from "@acme/env";

import { health, posts } from "~/routes/index.js";
import { appRouter } from "~/rpc/app.js";
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

const startServer = () => {
	serve(
		{
			fetch: app.fetch,
			port: env.PORT,
		},
		(info) => {
			console.log(`Server is running on http://localhost:${info.port}`);
		},
	);
};

export default app;
export { startServer };
