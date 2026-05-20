DROP TABLE "payroll_table" CASCADE;--> statement-breakpoint
ALTER TABLE "staff_table" ADD COLUMN "age" integer;--> statement-breakpoint
ALTER TABLE "staff_table" ADD COLUMN "address" text;--> statement-breakpoint
ALTER TABLE "staff_table" ADD COLUMN "advance" numeric(12, 2) DEFAULT '0';