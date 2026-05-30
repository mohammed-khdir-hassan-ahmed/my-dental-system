CREATE TABLE "staff_table" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"phonenumber" varchar(20) NOT NULL,
	"salary" numeric(12, 2) DEFAULT '0',
	"date" date DEFAULT now(),
	"created_at" date DEFAULT now()
);
