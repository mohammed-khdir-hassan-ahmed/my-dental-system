CREATE TABLE IF NOT EXISTS "transactions_table" (
	"id" serial PRIMARY KEY NOT NULL,
	"staff_id" integer NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"type" varchar(50) NOT NULL,
	"date" timestamp DEFAULT now(),
	"note" text,
	"created_at" timestamp DEFAULT now()
);

ALTER TABLE "staff_table" 
RENAME COLUMN "name" TO "full_name";

ALTER TABLE "staff_table" 
ADD COLUMN "role" text;

ALTER TABLE "staff_table" 
RENAME COLUMN "salary" TO "basic_salary";

ALTER TABLE "staff_table" 
ADD COLUMN "status" varchar(20) DEFAULT 'Active';

ALTER TABLE "staff_table" 
DROP COLUMN IF EXISTS "advance";

ALTER TABLE "staff_table" 
RENAME COLUMN "date" TO "updated_at";

ALTER TABLE "staff_table"
ALTER COLUMN "created_at" SET DEFAULT now(),
ALTER COLUMN "created_at" SET DATA TYPE timestamp;
