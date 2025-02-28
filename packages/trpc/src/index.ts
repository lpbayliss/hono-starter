import { trpcServer } from "@hono/trpc-server";

import { appRouter } from "./routers/app.js";

export const trpc = trpcServer({
	endpoint: "/api/trpc",
	router: appRouter,
});

export type { AppRouter } from "./routers/app.js";
