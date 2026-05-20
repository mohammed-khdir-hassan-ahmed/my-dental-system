CREATE TABLE "otpcode" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" varchar(10) NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "otpcode_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "payroll_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"month_key" varchar(7) NOT NULL,
	"year" integer NOT NULL,
	"month" integer NOT NULL,
	"total_salary_paid" numeric(12, 2) DEFAULT '0',
	"total_advances" numeric(12, 2) DEFAULT '0',
	"total_staff" integer DEFAULT 0,
	"finalized_at" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "payroll_history_month_key_unique" UNIQUE("month_key")
);
