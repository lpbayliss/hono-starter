import { pino } from "pino";
import env from "@acme/env";

const logger = pino({
	level: env.NODE_ENV === "production" ? "info" : "debug",
	transport:
		env.NODE_ENV === "production"
			? undefined
			: { target: "pino-pretty", options: { colorize: true } }, // Pretty print in dev
});

export default logger;
