import { NextResponse } from 'next/server';
import { db } from '@/db/drizzle';
import { salesTable } from '@/db/schema';
import { sql, desc, and, gte, lt } from 'drizzle-orm';

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

    const startDateStr = toDateOnly(startDate)
    const endDateStr = toDateOnly(endDate)

    // Get recent sales
    const recentSales = await db
      .select()
      .from(salesTable)
      .where(
        and(
          gte(salesTable.date, startDateStr),
          lt(salesTable.date, endDateStr)
        )
      )
      .orderBy(desc(salesTable.createdAt))
      .limit(10);

    const totalSales = recentSales.reduce(
      (sum, sale) => sum + Number(sale.totalPrice || 0),
      0
    );

    const totalProfit = recentSales.reduce(
      (sum, sale) => sum + Number(sale.profit || 0),
      0
    );

    return NextResponse.json({
      data: {
        totalMonthSales: totalSales,
        totalMonthProfit: totalProfit,
        recentSales: recentSales.map(sale => ({
          id: sale.id,
          productName: sale.productName,
          category: sale.category,
          price: Number(sale.price),
          quantity: sale.quantity,
          totalPrice: Number(sale.totalPrice),
          profit: Number(sale.profit),
          date: sale.date,
        })),
      },
    });
  } catch (error) {
    console.error('Error fetching recent sales:', error);
    return NextResponse.json(
      { message: 'هەڵە لە هێنانی زانیاری فرۆشتن' },
      { status: 500 }
    );
  }
}
