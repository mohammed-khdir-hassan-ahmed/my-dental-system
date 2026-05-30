CREATE TABLE "advance_requests_table" (
	"id" serial PRIMARY KEY NOT NULL,
	"staff_id" integer NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"reason" text,
	"status" varchar(20) DEFAULT 'pending',
	"needed_by_date" date,
	"created_at" timestamp DEFAULT now()
);
