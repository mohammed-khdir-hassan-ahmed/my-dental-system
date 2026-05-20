import { NextResponse } from 'next/server';
import { db } from '@/db/drizzle';
import { installmentsTable, paymentHistoryTable } from '@/db/schema';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { installmentId } = await request.json();

    if (!installmentId) {
      return NextResponse.json(
        { message: ' installmentId پێویستە' },
        { status: 400 }
      );
    }

    // Get current installment
    const [installment] = await db
      .select()
      .from(installmentsTable)
      .where(eq(installmentsTable.id, installmentId));

    if (!installment) {
      return NextResponse.json(
        { message: 'قیستەکە نەدۆزرایەوە' },
        { status: 404 }
      );
    }

    // Get all payment history for this installment
    const paymentHistory = await db
      .select()
      .from(paymentHistoryTable)
      .where(eq(paymentHistoryTable.installmentId, installmentId));

    // Calculate actual paid amount from payment history
    const actualPaidAmount = paymentHistory.reduce(
      (sum, ph) => sum + parseFloat(ph.amountPaid || '0'),
      0
    );

    const totalAmount = parseFloat(installment.totalAmount || '0');
    const actualRemainingAmount = Math.max(0, totalAmount - actualPaidAmount);

    // Determine new status
    let newStatus = installment.status;
    if (actualRemainingAmount === 0) {
      newStatus = 'Paid';
    } else if (installment.nextPaymentDate) {
      const nextPaymentDate = new Date(installment.nextPaymentDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      nextPaymentDate.setHours(0, 0, 0, 0);
      
      if (nextPaymentDate < today) {
        newStatus = 'Overdue';
      } else {
        newStatus = 'Pending';
      }
    }

    // Update installment with correct amounts
    const [updatedInstallment] = await db
      .update(installmentsTable)
      .set({
        paidAmount: actualPaidAmount.toString(),
        remainingAmount: actualRemainingAmount.toString(),
        status: newStatus,
      })
      .where(eq(installmentsTable.id, installmentId))
      .returning();

    return NextResponse.json(
      { 
        message: 'سەرکەوتووبوو', 
        installment: updatedInstallment,
        actualPaidAmount,
        actualRemainingAmount 
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error syncing payment amounts:', error);
    return NextResponse.json(
      { message: 'هەڵەیەک ڕویدا لە سروەر' },
      { status: 500 }
    );
  }
}
