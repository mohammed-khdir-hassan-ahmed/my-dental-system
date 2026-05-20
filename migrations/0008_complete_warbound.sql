CREATE TABLE "admin_notifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"type" varchar(32) DEFAULT 'login' NOT NULL,
	"user_email" text NOT NULL,
	"user_id" integer,
	"login_method" varchar(16) NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"read" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "push_subscriptions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"endpoint" text NOT NULL,
	"p256dh" text NOT NULL,
	"auth" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "push_subscriptions_endpoint_unique" UNIQUE("endpoint")
);
--> statement-breakpoint
ALTER TABLE "installments" ADD COLUMN "age" text;--> statement-breakpoint
ALTER TABLE "installments" ADD COLUMN "phone_number" text;--> statement-breakpoint
ALTER TABLE "installments" ADD COLUMN "address" text;--> statement-breakpoint
ALTER TABLE "users_table" ADD COLUMN "role" varchar(20) DEFAULT 'user' NOT NULL;--> statement-breakpoint
ALTER TABLE "users_table" ADD COLUMN "permissions" text;