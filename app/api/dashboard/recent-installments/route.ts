import { NextResponse } from 'next/server';
import { db } from '@/db/drizzle';
import { installmentsTable } from '@/db/schema';
import { sql, desc } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Get recent installments
    const recentInstallments = await db
      .select()
      .from(installmentsTable)
      .orderBy(desc(installmentsTable.createdAt))
      .limit(10);

    // Get pending installments
    const pendingInstallments = recentInstallments.filter(
      inst => inst.status === 'Pending'
    );

    // Calculate totals
    const totalPendingAmount = pendingInstallments.reduce(
      (sum, inst) => sum + Number(inst.remainingAmount || 0),
      0
    );

    const totalPaidAmount = recentInstallments.reduce(
      (sum, inst) => sum + Number(inst.paidAmount || 0),
      0
    );

    const totalAmount = recentInstallments.reduce(
      (sum, inst) => sum + Number(inst.totalAmount || 0),
      0
    );

    return NextResponse.json({
      data: {
        totalPendingAmount,
        totalPaidAmount,
        totalAmount,
        pendingCount: pendingInstallments.length,
        recentInstallments: recentInstallments.map(inst => ({
          id: inst.id,
          patientName: inst.patientName,
          totalAmount: Number(inst.totalAmount),
          paidAmount: Number(inst.paidAmount),
          remainingAmount: Number(inst.remainingAmount),
          installmentValue: Number(inst.installmentValue),
          nextPaymentDate: inst.nextPaymentDate,
          status: inst.status,
        })),
      },
    });
  } catch (error) {
    console.error('Error fetching recent installments:', error);
    return NextResponse.json(
      { message: 'هەڵە لە هێنانی زانیاری قیستەکان' },
      { status: 500 }
    );
  }
}
