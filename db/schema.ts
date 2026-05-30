import { integer, pgTable, serial, text, date, varchar, numeric, timestamp, boolean, uuid, pgEnum } from 'drizzle-orm/pg-core';

export const usersTable = pgTable('users_table', {
  id: serial('id').primaryKey(),
  email: text('email').notNull().unique(),
  password: text('password').notNull(),
  role: varchar('role', { length: 20 }).notNull().default('user'),
  permissions: text('permissions'),
});

export const appointmentsTable = pgTable('appointments_table', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  gender: varchar('gender', { length: 50 }).notNull(),
  phone: varchar('phone', { length: 20 }).notNull(),
  age: integer('age').notNull(),
  treatmentType: text('treatment_type').notNull(),
  appointmentDate: date('appointment_date').notNull(),
  money: numeric('money', { precision: 10, scale: 2 }).default('0'),
  createdAt: date('created_at').defaultNow(),
});

export const staffTable = pgTable('staff_table', {
  id: serial('id').primaryKey(),
  fullName: text('full_name').notNull(),
  role: text('role').notNull(),
  phonenumber: varchar('phonenumber', { length: 20 }).notNull(),
  basicSalary: numeric('basic_salary', { precision: 12, scale: 2 }).default('0'),
  age: integer('age'),
  address: text('address'),
  status: varchar('status', { length: 20 }).default('Active'), // Active/Inactive
  date: date('date').defaultNow(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const transactionsTable = pgTable('transactions_table', {
  id: serial('id').primaryKey(),
  staffId: integer('staff_id').notNull(),
  amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
  type: varchar('type', { length: 50 }).notNull(), // Advance/Salary
  date: timestamp('date').defaultNow(),
  note: text('note'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const monthlyRecordsTable = pgTable('monthly_records', {
  id: serial('id').primaryKey(),
  staffId: integer('staff_id').notNull(),
  amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
  type: varchar('type', { length: 20 }).notNull(), // Advance/Salary
  date: timestamp('date').defaultNow(),
  note: text('note'),
  monthKey: varchar('month_key', { length: 7 }).notNull(), // MM-YYYY
  isPaid: boolean('is_paid').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const salesTable = pgTable('sales_table', {
  id: serial('id').primaryKey(),
  productName: text('product_name').notNull(),
  category: varchar('category', { length: 100 }).notNull(),
  price: numeric('price', { precision: 12, scale: 2 }).notNull(),
  quantity: integer('quantity').default(1).notNull(),
  totalPrice: numeric('total_price', { precision: 12, scale: 2 }).notNull(),
  profit: numeric('profit', { precision: 12, scale: 2 }).notNull(),
  date: date('date').notNull(),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Backward-compatible alias for older imports.
export const payrollTable = monthlyRecordsTable;

export const advanceRequestsTable = pgTable('advance_requests_table', {
  id: serial('id').primaryKey(),
  staffId: integer('staff_id').notNull(),
  amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
  reason: text('reason'),
  status: varchar('status', { length: 20 }).default('pending'),
  neededByDate: date('needed_by_date'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const expenseCategoryEnum = pgEnum('expense_category', [
  'کەرەستەی پزیشکی',
  'کرێ و خزمەتگوزاری',
  'مووچە',
  'چاککردنەوە',
  'خەرجی گشتی',
]);

export const paymentMethodEnum = pgEnum('payment_method', ['کاش', 'کارت', 'حەواڵە']);

export const expensesTable = pgTable('expenses', {
  id: uuid('id').primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  category: expenseCategoryEnum('category').notNull(),
  amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
  date: date('date').notNull(),
  paymentMethod: paymentMethodEnum('payment_method').notNull(),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const installmentStatusEnum = pgEnum('installment_status', ['Paid', 'Pending', 'Overdue']);

export const installmentsTable = pgTable('installments', {
  id: serial('id').primaryKey(),
  patientName: text('patient_name').notNull(),
  totalAmount: numeric('total_amount', { precision: 10, scale: 2 }).notNull(),
  paidAmount: numeric('paid_amount', { precision: 10, scale: 2 }).default('0'),
  remainingAmount: numeric('remaining_amount', { precision: 10, scale: 2 }).notNull(),
  installmentValue: numeric('installment_value', { precision: 10, scale: 2 }).notNull(),
  nextPaymentDate: date('next_payment_date'),
  status: installmentStatusEnum('status').default('Pending'),
  age: text('age'),
  phoneNumber: text('phone_number'),
  address: text('address'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const paymentHistoryTable = pgTable('payment_history', {
  id: serial('id').primaryKey(),
  installmentId: integer('installment_id').references(() => installmentsTable.id).notNull(),
  amountPaid: numeric('amount_paid', { precision: 10, scale: 2 }).notNull(),
  paymentDate: date('payment_date').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const payrollHistoryTable = pgTable('payroll_history', {
  id: serial('id').primaryKey(),
  monthKey: varchar('month_key', { length: 7 }).notNull().unique(), // MM-YYYY
  year: integer('year').notNull(),
  month: integer('month').notNull(),
  totalSalaryPaid: numeric('total_salary_paid', { precision: 12, scale: 2 }).default('0'),
  totalAdvances: numeric('total_advances', { precision: 12, scale: 2 }).default('0'),
  totalStaff: integer('total_staff').default(0),
  finalizedAt: timestamp('finalized_at').defaultNow(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const otpcodeTable = pgTable('otpcode', {
  id: serial('id').primaryKey(),
  code: varchar('code', { length: 10 }).notNull().unique(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const adminNotificationsTable = pgTable('admin_notifications', {
  id: serial('id').primaryKey(),
  type: varchar('type', { length: 32 }).notNull().default('login'),
  userEmail: text('user_email').notNull(),
  userId: integer('user_id'),
  loginMethod: varchar('login_method', { length: 16 }).notNull(),
  title: text('title').notNull(),
  message: text('message').notNull(),
  read: boolean('read').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const pushSubscriptionsTable = pgTable('push_subscriptions', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull(),
  endpoint: text('endpoint').notNull().unique(),
  p256dh: text('p256dh').notNull(),
  auth: text('auth').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

