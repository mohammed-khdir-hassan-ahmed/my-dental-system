import { db } from '@/db/drizzle';
import { expensesTable } from '@/db/schema';
import { expenseCategories, paymentMethods } from '@/lib/types/expense';
import { and, desc, eq, gte, ilike, lt, sql, type SQL } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const getMonthStart = (date = new Date()) => new Date(date.getFullYear(), date.getMonth(), 1);

const getNextMonthStart = (date = new Date()) => new Date(date.getFullYear(), date.getMonth() + 1, 1);

const toDateOnly = (date: Date) => date.toISOString().slice(0, 10);

const isValidCategory = (value: string): value is (typeof expenseCategories)[number] =>
  expenseCategories.includes(value as (typeof expenseCategories)[number]);

const isValidPaymentMethod = (value: string): value is (typeof paymentMethods)[number] =>
  paymentMethods.includes(value as (typeof paymentMethods)[number]);

async function ensureExpensesTable() {
  await db.execute(sql`
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
  `);

  await db.execute(sql`
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
  `);
}

export async function GET(request: NextRequest) {
  try {
    await ensureExpensesTable();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search')?.trim() || '';
    const month = searchParams.get('month');
    const scope = searchParams.get('scope');
    const period = searchParams.get('period') || 'month';
    const from = searchParams.get('from');
    const to = searchParams.get('to');

    const conditions: SQL[] = [];

    // Handle custom date range
    if (from && to) {
      conditions.push(gte(expensesTable.date, from));
      conditions.push(lt(expensesTable.date, to));
    } 
    // Handle period parameter if not using scope, month, or custom dates
    else if (!scope && !month) {
      const now = new Date();
      let startDate: Date;
      let endDate: Date;

      if (period === 'today') {
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      } else if (period === 'week') {
        const dayOfWeek = now.getDay();
        const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
        startDate = new Date(now.getFullYear(), now.getMonth(), diff);
        endDate = new Date(now.getFullYear(), now.getMonth(), diff + 7);
      } else if (period !== 'all') {
        startDate = getMonthStart(now);
        endDate = getNextMonthStart(now);
      }

      if (period !== 'all') {
        conditions.push(gte(expensesTable.date, toDateOnly(startDate)));
        conditions.push(lt(expensesTable.date, toDateOnly(endDate)));
      }
    } else if (scope !== 'all') {
      const now = new Date();
      const startDate = month ? new Date(`${month}-01`) : getMonthStart(now);
      const endDate = month ? getNextMonthStart(startDate) : getNextMonthStart(now);
      conditions.push(gte(expensesTable.date, toDateOnly(startDate)));
      conditions.push(lt(expensesTable.date, toDateOnly(endDate)));
    }

    if (search) {
      conditions.push(ilike(expensesTable.title, `%${search}%`));
    }

    const baseQuery = db.select().from(expensesTable);

    const expenses =
      conditions.length > 0
        ? await baseQuery.where(and(...conditions)).orderBy(desc(expensesTable.date))
        : await baseQuery.orderBy(desc(expensesTable.date));

    return NextResponse.json(expenses);
  } catch (error) {
    console.error('Error fetching expenses:', error);
    return NextResponse.json({ error: 'هەڵە لە هێنانی خەرجییەکان' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await ensureExpensesTable();

    const body = await request.json();
    const title = String(body.title ?? '').trim();
    const category = String(body.category ?? '').trim();
    const amount = Number(body.amount);
    const date = String(body.date ?? '').trim();
    const paymentMethod = String(body.paymentMethod ?? '').trim();
    const notes = body.notes ? String(body.notes).trim() : null;

    if (!title || !date || !Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ error: 'زانیارییە سەرەکییەکان نادروستن' }, { status: 400 });
    }

    if (!isValidCategory(category)) {
      return NextResponse.json({ error: 'جۆری خەرجی هەڵەیە' }, { status: 400 });
    }

    if (!isValidPaymentMethod(paymentMethod)) {
      return NextResponse.json({ error: 'ڕێگەی پارەدان هەڵەیە' }, { status: 400 });
    }

    const result = await db
      .insert(expensesTable)
      .values({
        id: crypto.randomUUID(),
        title,
        category,
        amount: amount.toString(),
        date,
        paymentMethod,
        notes,
      })
      .returning();

    return NextResponse.json(result[0], { status: 201 });
  } catch (error) {
    console.error('Error creating expense:', error);
    return NextResponse.json({ error: 'هەڵە لە زیادکردنی خەرجیدا' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    await ensureExpensesTable();

    const body = await request.json();
    const id = String(body.id ?? '').trim();
    const title = String(body.title ?? '').trim();
    const category = String(body.category ?? '').trim();
    const amount = Number(body.amount);
    const date = String(body.date ?? '').trim();
    const paymentMethod = String(body.paymentMethod ?? '').trim();
    const notes = body.notes ? String(body.notes).trim() : null;

    if (!id || !title || !date || !Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ error: 'زانیارییە سەرەکییەکان نادروستن' }, { status: 400 });
    }

    if (!isValidCategory(category)) {
      return NextResponse.json({ error: 'جۆری خەرجی هەڵەیە' }, { status: 400 });
    }

    if (!isValidPaymentMethod(paymentMethod)) {
      return NextResponse.json({ error: 'ڕێگەی پارەدان هەڵەیە' }, { status: 400 });
    }

    const updated = await db
      .update(expensesTable)
      .set({
        title,
        category,
        amount: amount.toString(),
        date,
        paymentMethod,
        notes,
      })
      .where(eq(expensesTable.id, id))
      .returning();

    if (updated.length === 0) {
      return NextResponse.json({ error: 'خەرجی نەدۆزرایەوە' }, { status: 404 });
    }

    return NextResponse.json(updated[0], { status: 200 });
  } catch (error) {
    console.error('Error updating expense:', error);
    return NextResponse.json({ error: 'هەڵە لە نوێکردنەوەی خەرجیدا' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await ensureExpensesTable();

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'شناسە بێ' }, { status: 400 });
    }

    await db.delete(expensesTable).where(eq(expensesTable.id, id));

    return NextResponse.json({ message: 'سڕایەوە' });
  } catch (error) {
    console.error('Error deleting expense:', error);
    return NextResponse.json({ error: 'هەڵە لە سڕینەوەی خەرجیدا' }, { status: 500 });
  }
}
