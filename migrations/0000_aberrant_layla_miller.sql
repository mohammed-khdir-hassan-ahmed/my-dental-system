CREATE TABLE "appointments_table" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"gender" varchar(50) NOT NULL,
	"phone" varchar(20) NOT NULL,
	"age" integer NOT NULL,
	"treatment_type" text NOT NULL,
	"appointment_date" date NOT NULL,
	"money" numeric(10, 2) DEFAULT '0',
	"created_at" date DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "users_table" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"password" text NOT NULL,
	CONSTRAINT "users_table_email_unique" UNIQUE("email")
);
