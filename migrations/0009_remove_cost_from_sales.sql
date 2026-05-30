-- Remove cost and totalCost columns from sales_table
ALTER TABLE sales_table DROP COLUMN IF EXISTS cost;
ALTER TABLE sales_table DROP COLUMN IF EXISTS total_cost;
