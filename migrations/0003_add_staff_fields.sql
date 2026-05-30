-- Add new columns to staff_table
ALTER TABLE staff_table ADD COLUMN age INTEGER;
ALTER TABLE staff_table ADD COLUMN address TEXT;
ALTER TABLE staff_table ADD COLUMN advance NUMERIC(12, 2) DEFAULT 0;
