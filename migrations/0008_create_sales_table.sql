-- Create sales table for tracking product sales
CREATE TABLE IF NOT EXISTS sales_table (
    id SERIAL PRIMARY KEY,
    product_name TEXT NOT NULL,
    category VARCHAR(100) NOT NULL,
    price NUMERIC(12, 2) NOT NULL,
    cost NUMERIC(12, 2) NOT NULL,
    quantity INTEGER DEFAULT 1 NOT NULL,
    total_price NUMERIC(12, 2) NOT NULL,
    total_cost NUMERIC(12, 2) NOT NULL,
    profit NUMERIC(12, 2) NOT NULL,
    date DATE NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_sales_date ON sales_table(date);
CREATE INDEX IF NOT EXISTS idx_sales_category ON sales_table(category);
CREATE INDEX IF NOT EXISTS idx_sales_product_name ON sales_table(product_name);
