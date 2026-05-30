import { NextResponse } from 'next/server';
import { db } from '@/db/drizzle';
import { paymentHistoryTable, installmentsTable } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const paymentHistory = await db
      .select({
        id: paymentHistoryTable.id,
        installmentId: paymentHistoryTable.installmentId,
        amountPaid: paymentHistoryTable.amountPaid,
        paymentDate: paymentHistoryTable.paymentDate,
        createdAt: paymentHistoryTable.createdAt,
        patientName: installmentsTable.patientName,
      })
      .from(paymentHistoryTable)
      .innerJoin(installmentsTable, eq(paymentHistoryTable.installmentId, installmentsTable.id))
      .orderBy(desc(paymentHistoryTable.paymentDate));

    return NextResponse.json(paymentHistory, { status: 200 });
  } catch (error) {
    console.error('Error fetching payment history:', error);
    return NextResponse.json(
      { message: 'هەڵە لە هێنانی مێژووی پارەدان' },
      { status: 500 }
    );
  }
}
