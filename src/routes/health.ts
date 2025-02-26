import { Hono } from "hono";
import env from "~/lib/env.js";

const app = new Hono();

app.get("/", (c) =>
	c.json({
		status: "ok",
		environment: env.NODE_ENV,
	}),
);

export default app;
