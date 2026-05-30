DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'expense_category') THEN
    CREATE TYPE expense_category AS ENUM (
      'کەرەستەی پزیشکی',
      'کرێ و خزمەتگوزاری',
      'مووچە',
      'چاککردنەوە',
      'خەرجی گشتی'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_method') THEN
    CREATE TYPE payment_method AS ENUM ('کاش', 'کارت', 'حەواڵە');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS expenses (
  id uuid PRIMARY KEY,
  title varchar(255) NOT NULL,
  category expense_category NOT NULL,
  amount numeric(12, 2) NOT NULL,
  date date NOT NULL,
  payment_method payment_method NOT NULL,
  notes text,
  created_at timestamp DEFAULT now()
);
