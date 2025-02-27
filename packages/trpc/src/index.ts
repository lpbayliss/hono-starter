import { trpcServer } from "@hono/trpc-server";
import { appRouter } from "./routers/app.js";

export const trpc = trpcServer({
	router: appRouter,
});
