import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { compress } from "hono/compress";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { poweredBy } from "hono/powered-by";
import { prometheus } from "@hono/prometheus";
import { trpcServer } from "@hono/trpc-server";

import { health } from "./routes/index.js";
import { appRouter } from "./rpc/app.js";

const app = new Hono();

const { printMetrics, registerMetrics } = prometheus();

app.use("*", registerMetrics);
app.get("/metrics", printMetrics);

app.use(poweredBy());
app.use(logger());
app.use(compress());
app.use("/api/*", cors());
app.route("/api/health", health);
app.use(
	"/trpc/*",
	trpcServer({
		router: appRouter,
	}),
);

serve(
	{
		fetch: app.fetch,
		port: 3000,
	},
	(info) => {
		console.log(`Server is running on http://localhost:${info.port}`);
	},
);
