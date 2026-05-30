export const expenseCategories = [
  'کەرەستەی پزیشکی',
  'کرێ و خزمەتگوزاری',
  'مووچە',
  'چاککردنەوە',
  'خەرجی گشتی',
] as const;

export const paymentMethods = ['کاش', 'کارت', 'حەواڵە'] as const;

export type ExpenseCategory = (typeof expenseCategories)[number];
export type PaymentMethod = (typeof paymentMethods)[number];

export interface Expense {
  id: string;
  title: string;
  category: ExpenseCategory;
  amount: string;
  date: string;
  paymentMethod: PaymentMethod;
  notes: string | null;
  createdAt?: string | null;
}
