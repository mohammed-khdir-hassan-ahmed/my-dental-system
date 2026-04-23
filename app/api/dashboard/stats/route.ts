import { NextResponse } from 'next/server';
import { db } from '@/db/drizzle';
import { 
  appointmentsTable, 
  staffTable, 
  salesTable, 
  expensesTable,
  installmentsTable 
} from '@/db/schema';
import { sql, and, gte, lt, desc, eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';
export const revalidate = 30; // Revalidate every 30 seconds

function getMonthStart(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function getNextMonthStart(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 1);
}

function toDateOnly(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
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

    // Get current period appointments
    const currentPeriodAppointments = await db
      .select()
      .from(appointmentsTable)
      .where(
        and(
          gte(appointmentsTable.appointmentDate, monthStartStr),
          lt(appointmentsTable.appointmentDate, nextMonthStartStr)
        )
      );

    // Get all appointments for comparison
    const allAppointments = await db.select().from(appointmentsTable);
    
    // Get previous month appointments
    const prevMonthStart = getMonthStart(new Date(now.getFullYear(), now.getMonth() - 1));
    const prevMonthStartStr = toDateOnly(prevMonthStart);
    const prevMonthAppointments = await db
      .select()
      .from(appointmentsTable)
      .where(
        and(
          gte(appointmentsTable.appointmentDate, prevMonthStartStr),
          lt(appointmentsTable.appointmentDate, monthStartStr)
        )
      );

    // Calculate revenue from appointments
    const currentPeriodRevenue = currentPeriodAppointments.reduce(
      (sum, apt) => sum + Number(apt.money || 0), 
      0
    );
    
    const prevMonthRevenue = prevMonthAppointments.reduce(
      (sum, apt) => sum + Number(apt.money || 0), 
      0
    );

    // Get sales revenue
    const currentPeriodSales = await db
      .select()
      .from(salesTable)
      .where(
        and(
          gte(salesTable.date, monthStartStr),
          lt(salesTable.date, nextMonthStartStr)
        )
      );

    const salesRevenue = currentPeriodSales.reduce(
      (sum, sale) => sum + Number(sale.totalPrice || 0), 
      0
    );

    const totalRevenue = currentPeriodRevenue + salesRevenue;

    // Get expenses for current period (this month)
    const currentPeriodExpenses = await db
      .select()
      .from(expensesTable)
      .where(
        and(
          gte(expensesTable.date, monthStartStr),
          lt(expensesTable.date, nextMonthStartStr)
        )
      );

    const totalExpenses = currentPeriodExpenses.reduce(
      (sum, exp) => sum + Number(exp.amount || 0), 
      0
    );

    // Calculate expenses breakdown by category
    const expensesBreakdown = currentPeriodExpenses.reduce((acc: Record<string, number>, exp) => {
      const category = exp.category || 'خەرجی گشتی';
      acc[category] = (acc[category] || 0) + Number(exp.amount || 0);
      return acc;
    }, {});

    // Get today's appointment payments (money from patients who came today)
    const todayStr = toDateOnly(now);
    const todayAppointments = await db
      .select()
      .from(appointmentsTable)
      .where(eq(appointmentsTable.appointmentDate, todayStr));
    
    const todayPaymentsTotal = todayAppointments.reduce(
      (sum, apt) => sum + Number(apt.money || 0), 
      0
    );
    
    const todayPatientsCount = todayAppointments.filter(apt => Number(apt.money || 0) > 0).length;

    // Get staff count
    const staff = await db.select().from(staffTable);
    const activeStaff = staff.filter(s => s.status === 'Active').length;

    // Get unique patients (by phone number)
    const uniquePatients = new Set(allAppointments.map(apt => apt.phone)).size;

    // Get all installments for total pending amount
    const allInstallments = await db
      .select()
      .from(installmentsTable);

    const pendingInstallmentsAmount = allInstallments.reduce(
      (sum, inst) => sum + Number(inst.remainingAmount || 0), 
      0
    );

    // Calculate trends
    const appointmentTrend = prevMonthAppointments.length > 0 
      ? ((currentPeriodAppointments.length - prevMonthAppointments.length) / prevMonthAppointments.length) * 100
      : 0;

    const revenueTrend = prevMonthRevenue > 0
      ? ((totalRevenue - prevMonthRevenue) / prevMonthRevenue) * 100
      : 0;

    // Get last 6 months data for charts
    const chartData = [];
    for (let i = 5; i >= 0; i--) {
      const chartDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const chartMonthStart = getMonthStart(chartDate);
      const chartNextMonthStart = getNextMonthStart(chartDate);
      const chartMonthStartStr = toDateOnly(chartMonthStart);
      const chartNextMonthStartStr = toDateOnly(chartNextMonthStart);

      const monthAppointments = await db
        .select()
        .from(appointmentsTable)
        .where(
          and(
            gte(appointmentsTable.appointmentDate, chartMonthStartStr),
            lt(appointmentsTable.appointmentDate, chartNextMonthStartStr)
          )
        );

      const monthSales = await db
        .select()
        .from(salesTable)
        .where(
          and(
            gte(salesTable.date, chartMonthStartStr),
            lt(salesTable.date, chartNextMonthStartStr)
          )
        );

      const monthRevenue = monthAppointments.reduce(
        (sum, apt) => sum + Number(apt.money || 0), 
        0
      ) + monthSales.reduce(
        (sum, sale) => sum + Number(sale.totalPrice || 0), 
        0
      );

      chartData.push({
        month: chartDate.toLocaleDateString('ku-IQ', { month: 'short' }),
        revenue: Math.round(monthRevenue),
        appointments: monthAppointments.length,
      });
    }

    // Get recent appointments for table
    const recentAppointments = await db
      .select()
      .from(appointmentsTable)
      .orderBy(desc(appointmentsTable.createdAt))
      .limit(10);

    return NextResponse.json({
      stats: {
        totalRevenue,
        appointmentsRevenue: currentPeriodRevenue,
        salesRevenue,
        totalExpenses,
        todayExpenses: todayPaymentsTotal,
        todayPatientsCount,
        netProfit: totalRevenue - totalExpenses,
        appointmentsCount: currentPeriodAppointments.length,
        uniquePatients,
        activeStaff,
        pendingInstallmentsAmount,
        appointmentTrend,
        revenueTrend,
        treatmentBreakdown: currentPeriodAppointments.reduce((acc: Record<string, number>, apt) => {
          const type = apt.treatmentType || 'چارەسەری گشتی';
          acc[type] = (acc[type] || 0) + 1;
          return acc;
        }, {}),
        expensesBreakdown,
      },
      chartData,
      recentAppointments,
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json(
      { message: 'هەڵە لە هێنانی ئامارەکان' },
      { status: 500 }
    );
  }
}
