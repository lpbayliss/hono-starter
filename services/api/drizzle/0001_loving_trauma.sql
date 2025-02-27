CREATE TABLE "posts" (
	"id" uuid PRIMARY KEY NOT NULL,
	"body" varchar(255) NOT NULL
);
--> statement-breakpoint
DROP TABLE "test" CASCADE;