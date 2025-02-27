import { describe, expect, test } from "vitest";
import app from "./posts.js";

describe("Example", () => {
	test("GET /posts", async () => {
		const res = await app.request("/");
		expect(res.status).toBe(200);
		expect(await res.text()).toBe("Many posts");
	});

	test("POST /posts", async () => {
		const res = await app.request("/", {
			method: "POST",
		});
		expect(res.status).toBe(201);
		expect(res.headers.get("X-Custom")).toBe("Thank you");
		expect(await res.json()).toEqual({
			message: "Created",
		});
	});
});
