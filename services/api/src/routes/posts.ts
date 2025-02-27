import { to } from "await-to-js";
import { Hono } from "hono";

import { getDb } from "@acme/db";

const app = new Hono();
const db = getDb();

app.get("/", async (c) => {
	const [error, posts] = await to(db.query.posts.findMany());
	if (error) {
		console.error(error.message);
		return c.text("Error");
	}
	return c.json(posts);
});

app.post("/", (c) => {
	return c.json(
		{
			message: "Created",
		},
		201,
		{
			"X-Custom": "Thank you",
		},
	);
});

export default app;
