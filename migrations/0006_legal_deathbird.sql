CREATE TYPE "public"."expense_category" AS ENUM('کەرەستەی پزیشکی', 'کرێ و خزمەتگوزاری', 'مووچە', 'چاککردنەوە', 'خەرجی گشتی');--> statement-breakpoint
CREATE TYPE "public"."installment_status" AS ENUM('Paid', 'Pending', 'Overdue');--> statement-breakpoint
CREATE TYPE "public"."payment_method" AS ENUM('کاش', 'کارت', 'حەواڵە');--> statement-breakpoint
CREATE TABLE "expenses" (
	"id" uuid PRIMARY KEY NOT NULL,
	"title" varchar(255) NOT NULL,
	"category" "expense_category" NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"date" date NOT NULL,
	"payment_method" "payment_method" NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "installments" (
	"id" serial PRIMARY KEY NOT NULL,
	"patient_name" text NOT NULL,
	"total_amount" numeric(10, 2) NOT NULL,
	"paid_amount" numeric(10, 2) DEFAULT '0',
	"remaining_amount" numeric(10, 2) NOT NULL,
	"installment_value" numeric(10, 2) NOT NULL,
	"next_payment_date" date,
	"status" "installment_status" DEFAULT 'Pending',
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "monthly_records" (
	"id" serial PRIMARY KEY NOT NULL,
	"staff_id" integer NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"type" varchar(20) NOT NULL,
	"date" timestamp DEFAULT now(),
	"note" text,
	"month_key" varchar(7) NOT NULL,
	"is_paid" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "payment_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"installment_id" integer NOT NULL,
	"amount_paid" numeric(10, 2) NOT NULL,
	"payment_date" date NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sales_table" (
	"id" serial PRIMARY KEY NOT NULL,
	"product_name" text NOT NULL,
	"category" varchar(100) NOT NULL,
	"price" numeric(12, 2) NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"total_price" numeric(12, 2) NOT NULL,
	"profit" numeric(12, 2) NOT NULL,
	"date" date NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "transactions_table" (
	"id" serial PRIMARY KEY NOT NULL,
	"staff_id" integer NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"type" varchar(50) NOT NULL,
	"date" timestamp DEFAULT now(),
	"note" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "expenses_table" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "expenses_table" CASCADE;--> statement-breakpoint
ALTER TABLE "staff_table" ALTER COLUMN "created_at" SET DATA TYPE timestamp;--> statement-breakpoint
ALTER TABLE "staff_table" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "staff_table" ADD COLUMN "full_name" text NOT NULL;--> statement-breakpoint
ALTER TABLE "staff_table" ADD COLUMN "role" text NOT NULL;--> statement-breakpoint
ALTER TABLE "staff_table" ADD COLUMN "basic_salary" numeric(12, 2) DEFAULT '0';--> statement-breakpoint
ALTER TABLE "staff_table" ADD COLUMN "status" varchar(20) DEFAULT 'Active';--> statement-breakpoint
ALTER TABLE "payment_history" ADD CONSTRAINT "payment_history_installment_id_installments_id_fk" FOREIGN KEY ("installment_id") REFERENCES "public"."installments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff_table" DROP COLUMN "name";--> statement-breakpoint
ALTER TABLE "staff_table" DROP COLUMN "salary";--> statement-breakpoint
ALTER TABLE "staff_table" DROP COLUMN "advance";