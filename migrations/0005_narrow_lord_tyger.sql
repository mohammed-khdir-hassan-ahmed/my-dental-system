CREATE TABLE "expenses_table" (
	"id" serial PRIMARY KEY NOT NULL,
	"item_name" text NOT NULL,
	"category" varchar(100) NOT NULL,
	"price" numeric(12, 2) NOT NULL,
	"quantity" integer NOT NULL,
	"total_cost" numeric(12, 2) NOT NULL,
	"purchase_date" date NOT NULL,
	"description" text,
	"created_at" date DEFAULT now()
);
