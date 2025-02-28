import env from "@acme/env";
import { serve } from "@hono/node-server";
import { prometheus } from "@hono/prometheus";
import { Hono } from "hono";
import { compress } from "hono/compress";
import { cors } from "hono/cors";
import { logger as honoLogger } from "hono/logger";
import { poweredBy } from "hono/powered-by";
import { trpc } from "@acme/trpc";
import { auth } from "@acme/auth";

import logger from "~/lib/logger.js";
import { health, posts } from "~/routes/index.js";

const app = new Hono();

const { printMetrics, registerMetrics } = prometheus();

app.use("*", registerMetrics);
app.get("/metrics", printMetrics);

app.use(poweredBy());
app.use(honoLogger((str, ...rest) => logger.info(str, ...rest)));
app.use(compress());

app.use(
	"/api/auth/*", // or replace with "*" to enable cors for all routes
	cors({
		origin: env.WEB_URL, // replace with your origin
		allowHeaders: ["Content-Type", "Authorization"],
		allowMethods: ["POST", "GET", "OPTIONS"],
		exposeHeaders: ["Content-Length"],
		maxAge: 600,
		credentials: true,
	}),
);
app.on(["POST", "GET"], "/api/auth/*", (c) => {
	return auth.handler(c.req.raw);
});

app.use("/api/*", cors());
app.route("/api/health", health);
app.route("/api/posts", posts);

app.use("/api/trpc/*", trpc);

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
