import { NextResponse } from 'next/server';
import { and, desc, eq, sql, gte, lte } from 'drizzle-orm';
import { db } from '@/db/drizzle';
import { monthlyRecordsTable, payrollHistoryTable, staffTable } from '@/db/schema';

export const dynamic = 'force-dynamic';

const getMonthKey = (date = new Date()) => {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${month}-${date.getFullYear()}`;
};

const getMonthStart = (year: number, month: number) => {
  return new Date(year, month - 1, 1);
};

const getMonthEnd = (year: number, month: number) => {
  return new Date(year, month, 0, 23, 59, 59, 999);
};

async function ensureMonthlyRecordsTable() {
  try {
    // Test database connection by selecting from staff table
    await db.select().from(staffTable).limit(1);
  } catch (error) {
    console.error('Database connection failed:', error);
    throw new Error('Database connection failed');
  }
}

export async function GET(request: Request) {
  try {
    await ensureMonthlyRecordsTable();

    const { searchParams } = new URL(request.url);
    const monthKey = searchParams.get('monthKey');
    const year = searchParams.get('year');
    const month = searchParams.get('month');
    const staffId = searchParams.get('staffId');
    const type = searchParams.get('type');
    const includePaid = searchParams.get('includePaid') === '1';
    const getAvailableMonths = searchParams.get('getAvailableMonths') === '1';

    // If requesting available months
    if (getAvailableMonths) {
      const months = await db
        .selectDistinct({
          year: sql`EXTRACT(YEAR FROM ${monthlyRecordsTable.date})`,
          month: sql`EXTRACT(MONTH FROM ${monthlyRecordsTable.date})`,
        })
        .from(monthlyRecordsTable)
        .orderBy(desc(sql`EXTRACT(YEAR FROM ${monthlyRecordsTable.date})`), desc(sql`EXTRACT(MONTH FROM ${monthlyRecordsTable.date})`));

      const uniqueMonths = months.map((m) => ({
        year: Number(m.year),
        month: Number(m.month),
        monthKey: `${String(Number(m.month)).padStart(2, '0')}-${m.year}`,
      }));

      return NextResponse.json(uniqueMonths, { status: 200 });
    }

    const conditions = [];

    // Filter by date range if year and month are provided
    if (year && month) {
      const yearNum = Number(year);
      const monthNum = Number(month);
      const startDate = getMonthStart(yearNum, monthNum);
      const endDate = getMonthEnd(yearNum, monthNum);
      conditions.push(gte(monthlyRecordsTable.date, startDate));
      conditions.push(lte(monthlyRecordsTable.date, endDate));
    } else if (monthKey) {
      // Fallback to monthKey filtering
      conditions.push(eq(monthlyRecordsTable.monthKey, monthKey));
    } else {
      // Default to current month
      const now = new Date();
      const startDate = getMonthStart(now.getFullYear(), now.getMonth() + 1);
      const endDate = getMonthEnd(now.getFullYear(), now.getMonth() + 1);
      conditions.push(gte(monthlyRecordsTable.date, startDate));
      conditions.push(lte(monthlyRecordsTable.date, endDate));
    }

    if (!includePaid) {
      conditions.push(eq(monthlyRecordsTable.isPaid, false));
    }

    if (staffId) {
      conditions.push(eq(monthlyRecordsTable.staffId, Number(staffId)));
    }

    if (type) {
      conditions.push(eq(monthlyRecordsTable.type, type));
    }

    const records = await db
      .select()
      .from(monthlyRecordsTable)
      .where(and(...conditions))
      .orderBy(desc(monthlyRecordsTable.date));

    return NextResponse.json(records, { status: 200 });
  } catch (error) {
    console.error('Error fetching monthly records:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ message: 'هەڵە لە هێنانی تۆمارەکانی مووچە', error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    console.log('POST /api/payroll: Starting request');

    console.log('POST /api/payroll: Ensuring monthly records table');
    await ensureMonthlyRecordsTable();
    console.log('POST /api/payroll: Table ensured successfully');

    console.log('POST /api/payroll: Parsing request body');
    const body = await request.json();
    console.log('POST /api/payroll: Body parsed', { action: body.action, staffId: body.staffId, amount: body.amount });
    const action = body.action; // 'add' or 'finalize'

    if (action === 'finalize') {
      // Generate monthly report and save to payroll_history
      const year = Number(body.year);
      const month = Number(body.month);
      const monthKey = body.monthKey || `${String(month).padStart(2, '0')}-${year}`;

      if (!year || !month) {
        return NextResponse.json({ message: 'ساڵ و مانگ پێویستن' }, { status: 400 });
      }

      // Get all records for the month
      const startDate = getMonthStart(year, month);
      const endDate = getMonthEnd(year, month);

      console.log('POST /api/payroll: Fetching records for the month');
      const records = await db
        .select()
        .from(monthlyRecordsTable)
        .where(
          and(
            gte(monthlyRecordsTable.date, startDate),
            lte(monthlyRecordsTable.date, endDate)
          )
        );
      console.log('POST /api/payroll: Records fetched', records.length);

      // Calculate totals
      const totalAdvances = records
        .filter(r => r.type === 'Advance' && !r.isPaid)
        .reduce((sum, r) => sum + Number(r.amount || 0), 0);

      const totalSalaryPaid = records
        .filter(r => r.type === 'Salary' && r.isPaid)
        .reduce((sum, r) => sum + Number(r.amount || 0), 0);

      // Get unique staff count for the month
      const uniqueStaffIds = new Set(records.map(r => r.staffId));
      const totalStaff = uniqueStaffIds.size;

      // Idempotent finalize:
      // - If payroll_history already has this monthKey, update totals + finalizedAt
      // - Otherwise insert a new row
      const finalizedAt = new Date();

      const updated = await db
        .update(payrollHistoryTable)
        .set({
          year,
          month,
          totalAdvances: totalAdvances.toString(),
          totalSalaryPaid: totalSalaryPaid.toString(),
          totalStaff,
          finalizedAt,
        })
        .where(eq(payrollHistoryTable.monthKey, monthKey))
        .returning();

      if (updated.length > 0) {
        return NextResponse.json({
          message: 'ڕاپۆرتی مانگانە نوێکرایەوە بە سەرکەوتوویی',
          record: updated[0],
        }, { status: 200 });
      }

      const inserted = await db
        .insert(payrollHistoryTable)
        .values({
          monthKey,
          year,
          month,
          totalAdvances: totalAdvances.toString(),
          totalSalaryPaid: totalSalaryPaid.toString(),
          totalStaff,
          finalizedAt,
        })
        .returning();

      return NextResponse.json({
        message: 'ڕاپۆرتی مانگانە بە سەرکەوتوویی دروستکرا',
        record: inserted[0],
      }, { status: 201 });
    }

    // Default: add new record
    const staffId = Number(body.staffId);
    const amount = Number(body.amount);
    const type = body.type || 'Advance';
    const rawDate = typeof body.date === 'string' ? body.date.trim() : '';
    const dateOnlyMatch = rawDate.match(/^(\d{4})-(\d{2})-(\d{2})$/);

    let recordDate = new Date();
    let monthKeyFromDate = getMonthKey(recordDate);

    if (rawDate) {
      if (dateOnlyMatch) {
        const [, year, month, day] = dateOnlyMatch;
        recordDate = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day), 12, 0, 0));
        monthKeyFromDate = `${month}-${year}`;
      } else {
        recordDate = new Date(rawDate);
        monthKeyFromDate = `${String(recordDate.getUTCMonth() + 1).padStart(2, '0')}-${recordDate.getUTCFullYear()}`;
      }
    }

    if (Number.isNaN(recordDate.getTime())) {
      return NextResponse.json({ message: 'بەرواری دروست بنووسە' }, { status: 400 });
    }

    const monthKey = rawDate ? monthKeyFromDate : (body.monthKey || monthKeyFromDate);

    if (!staffId || !amount || amount <= 0) {
      return NextResponse.json({ message: 'کارمەند و بڕی پارەی دروست پێویستن' }, { status: 400 });
    }

    const created = await db
      .insert(monthlyRecordsTable)
      .values({
        staffId,
        amount: amount.toString(),
        type,
        monthKey,
        date: recordDate,
        note: body.note ? String(body.note).trim() : null,
        isPaid: false,
      })
      .returning();

    return NextResponse.json({ message: 'سەرکەوتوو تۆمارکرا', record: created[0] }, { status: 201 });
  } catch (error) {
    console.error('Error in POST request:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ message: 'هەڵەیەک لە تۆمارکردندا ڕوویدا', error: message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    await ensureMonthlyRecordsTable();

    const body = await request.json();
    const action = body.action;

    if (action === 'getHistory') {
      // Get payroll history for a specific month
      const monthKey = body.monthKey;
      if (!monthKey) {
        return NextResponse.json({ message: 'monthKey پێویستە' }, { status: 400 });
      }

      const history = await db
        .select()
        .from(payrollHistoryTable)
        .where(eq(payrollHistoryTable.monthKey, monthKey))
        .limit(1);

      return NextResponse.json(history[0] || null, { status: 200 });
    }

    if (action === 'payAll') {
      // Mark all advance records as paid for the month
      const monthKey = body.monthKey || getMonthKey();
      const year = Number(monthKey.split('-')[1]);
      const month = Number(monthKey.split('-')[0]);

      const startDate = getMonthStart(year, month);
      const endDate = getMonthEnd(year, month);

      const updated = await db
        .update(monthlyRecordsTable)
        .set({ isPaid: true })
        .where(
          and(
            gte(monthlyRecordsTable.date, startDate),
            lte(monthlyRecordsTable.date, endDate),
            eq(monthlyRecordsTable.isPaid, false)
          )
        )
        .returning({ id: monthlyRecordsTable.id });

      return NextResponse.json(
        {
          message: 'مووچەی هەموو کارمەندەکان درا',
          monthKey,
          affectedRows: updated.length,
        },
        { status: 200 }
      );
    }

    // Default: mark records as paid (salary payment)
    const monthKey = body.monthKey || getMonthKey();
    const staffId = body.staffId;

    const conditions = [eq(monthlyRecordsTable.monthKey, monthKey)];
    if (staffId) {
      conditions.push(eq(monthlyRecordsTable.staffId, Number(staffId)));
    }

    const updated = await db
      .update(monthlyRecordsTable)
      .set({ isPaid: true })
      .where(and(...conditions, eq(monthlyRecordsTable.isPaid, false)))
      .returning({ id: monthlyRecordsTable.id });

    return NextResponse.json(
      {
        message: 'تۆمارەکان وەک داگیرکراو نیشاندرا',
        monthKey,
        affectedRows: updated.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in PATCH request:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ message: 'هەڵەیەک ڕوویدا', error: message }, { status: 500 });
  }
}
