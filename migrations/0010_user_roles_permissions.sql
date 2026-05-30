ALTER TABLE "users_table" ADD COLUMN IF NOT EXISTS "name" text;
ALTER TABLE "users_table" ADD COLUMN IF NOT EXISTS "role" varchar(20) NOT NULL DEFAULT 'user';
ALTER TABLE "users_table" ADD COLUMN IF NOT EXISTS "permissions" text;
ALTER TABLE "users_table" ADD COLUMN IF NOT EXISTS "is_active" boolean DEFAULT true;

-- First registered / test admin becomes full admin
UPDATE "users_table"
SET "role" = 'admin'
WHERE "email" = 'admin@dental.com' OR "id" = (SELECT MIN("id") FROM "users_table");
