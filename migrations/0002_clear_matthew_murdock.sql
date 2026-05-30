CREATE TABLE "payroll_table" (
	"id" serial PRIMARY KEY NOT NULL,
	"staff_id" integer NOT NULL,
	"staff_name" text NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"month" varchar(10) NOT NULL,
	"year" integer NOT NULL,
	"payment_date" date NOT NULL,
	"status" varchar(20) DEFAULT 'paid',
	"notes" text,
	"created_at" date DEFAULT now()
);
