import { NextResponse } from 'next/server';
import { db } from '@/db/drizzle';
import { expensesTable } from '@/db/schema';
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

    // Get current period expenses
    const currentPeriodExpenses = await db
      .select()
      .from(expensesTable)
      .where(
        and(
          gte(expensesTable.date, monthStartStr),
          lt(expensesTable.date, nextMonthStartStr)
        )
      );

    // Get all expenses for comparison
    const allExpenses = await db.select().from(expensesTable);

    // Group expenses by category
    const expenseCategories = currentPeriodExpenses.reduce((acc, exp) => {
      const category = exp.category || 'دیتر';
      if (!acc[category]) {
        acc[category] = 0;
      }
      acc[category] += Number(exp.amount || 0);
      return acc;
    }, {} as Record<string, number>);

    const totalExpenses = currentPeriodExpenses.reduce((sum, exp) => sum + Number(exp.amount || 0), 0);

    // Convert to array with percentages
    const expensesByCategory = Object.entries(expenseCategories)
      .map(([category, amount]) => ({
        category,
        amount,
        percentage: totalExpenses > 0 ? Math.round((amount / totalExpenses) * 100) : 0,
      }))
      .sort((a, b) => b.amount - a.amount);

    // Get recent expenses
    const recentExpenses = await db
      .select()
      .from(expensesTable)
      .orderBy(sql`${expensesTable.date} DESC`)
      .limit(5);

    return NextResponse.json({
      data: {
        totalExpenses,
        expensesByCategory,
        recentExpenses: recentExpenses.map(exp => ({
          id: exp.id,
          title: exp.title,
          category: exp.category,
          amount: Number(exp.amount),
          date: exp.date,
          paymentMethod: exp.paymentMethod,
        })),
      },
    });
  } catch (error) {
    console.error('Error fetching expenses summary:', error);
    return NextResponse.json(
      { message: 'هەڵە لە هێنانی زانیاری خەرجییەکان' },
      { status: 500 }
    );
  }
}
