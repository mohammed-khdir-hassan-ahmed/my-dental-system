import { NextResponse } from 'next/server';
import { db } from '@/db/drizzle';
import { appointmentsTable } from '@/db/schema';
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

export async function GET() {
  try {
    const now = new Date();
    const monthStart = getMonthStart(now);
    const nextMonthStart = getNextMonthStart(now);
    const monthStartStr = toDateOnly(monthStart);
    const nextMonthStartStr = toDateOnly(nextMonthStart);

    // Get current month appointments
    const currentMonthAppointments = await db
      .select()
      .from(appointmentsTable)
      .where(
        and(
          gte(appointmentsTable.appointmentDate, monthStartStr),
          lt(appointmentsTable.appointmentDate, nextMonthStartStr)
        )
      );

    // Group by treatment type
    const treatmentGroups = currentMonthAppointments.reduce((acc, apt) => {
      const treatment = apt.treatmentType || 'دیتر';
      if (!acc[treatment]) {
        acc[treatment] = 0;
      }
      acc[treatment]++;
      return acc;
    }, {} as Record<string, number>);

    const totalAppointments = currentMonthAppointments.length;

    // Convert to array with percentages
    const data = Object.entries(treatmentGroups)
      .map(([treatmentType, count]) => ({
        treatmentType,
        count,
        percentage: totalAppointments > 0 ? Math.round((count / totalAppointments) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count);

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error fetching treatment stats:', error);
    return NextResponse.json(
      { message: 'هەڵە لە هێنانی ئاماری چارەسەر' },
      { status: 500 }
    );
  }
}
