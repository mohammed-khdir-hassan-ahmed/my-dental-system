import { NextResponse } from 'next/server';
import { desc } from 'drizzle-orm';
import { db } from '@/db/drizzle';
import { payrollHistoryTable } from '@/db/schema';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const history = await db
      .select()
      .from(payrollHistoryTable)
      .orderBy(desc(payrollHistoryTable.finalizedAt));

    return NextResponse.json(history);
  } catch (error) {
    console.error('Error fetching payroll history:', error);
    return NextResponse.json(
      { message: 'خرابی لە هێنانی مێژوی موچە' },
      { status: 500 }
    );
  }
}
