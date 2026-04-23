import { NextResponse } from 'next/server';
import { db } from '@/db/drizzle';
import { appointmentsTable, salesTable, installmentsTable } from '@/db/schema';
import { sql, and, gte, lt } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

function getMonthStart(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function getNextMonthStart(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 1);
}

function toDateOnly(date: Date) {
  return date.toISOString().slice(0, 10);
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || 'month'

    const now = new Date();
    let startDate: Date
    let endDate: Date

    if (period === 'today') {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
    } else if (period === 'week') {
      const dayOfWeek = now.getDay()
      const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1)
      startDate = new Date(now.getFullYear(), now.getMonth(), diff)
      endDate = new Date(now.getFullYear(), now.getMonth(), diff + 7)
    } else if (period === 'all') {
      startDate = new Date(0)
      endDate = new Date()
    } else {
      startDate = getMonthStart(now)
      endDate = getNextMonthStart(now)
    }

    const monthStartStr = toDateOnly(startDate)
    const nextMonthStartStr = toDateOnly(endDate)

    // Get current period appointments revenue
    const currentMonthAppointments = await db
      .select()
      .from(appointmentsTable)
      .where(
        and(
          gte(appointmentsTable.appointmentDate, monthStartStr),
          lt(appointmentsTable.appointmentDate, nextMonthStartStr)
        )
      );

    const appointmentsRevenue = currentMonthAppointments.reduce(
      (sum, apt) => sum + Number(apt.money || 0),
      0
    );

    // Get current period sales revenue
    const currentMonthSales = await db
      .select()
      .from(salesTable)
      .where(
        and(
          gte(salesTable.date, monthStartStr),
          lt(salesTable.date, nextMonthStartStr)
        )
      );

    const salesRevenue = currentMonthSales.reduce(
      (sum, sale) => sum + Number(sale.totalPrice || 0),
      0
    );

    // Get current period installment payments
    const currentMonthInstallments = await db
      .select()
      .from(installmentsTable)
      .where(
        sql`${installmentsTable.createdAt} >= ${startDate}::timestamp AND ${installmentsTable.createdAt} < ${endDate}::timestamp`
      );

    const installmentsRevenue = currentMonthInstallments.reduce(
      (sum, inst) => sum + Number(inst.paidAmount || 0),
      0
    );

    // Calculate total revenue
    const totalRevenue = appointmentsRevenue + salesRevenue + installmentsRevenue;

    // Build income by section data
    const data = [
      {
        section: 'فرۆشتن',
        amount: salesRevenue,
        percentage: totalRevenue > 0 ? Math.round((salesRevenue / totalRevenue) * 100) : 0,
      },
      {
        section: 'قیستەکان',
        amount: installmentsRevenue,
        percentage: totalRevenue > 0 ? Math.round((installmentsRevenue / totalRevenue) * 100) : 0,
      },
      {
        section: 'چارەسەری',
        amount: appointmentsRevenue,
        percentage: totalRevenue > 0 ? Math.round((appointmentsRevenue / totalRevenue) * 100) : 0,
      },
    ].filter(item => item.amount > 0)
      .sort((a, b) => b.amount - a.amount);

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error fetching income sections:', error);
    return NextResponse.json(
      { message: 'هەڵە لە هێنانی بەشی داهات' },
      { status: 500 }
    );
  }
}
