import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/drizzle';
import { installmentsTable, paymentHistoryTable } from '@/db/schema';
import { eq } from 'drizzle-orm';
import {
  adminActionMessages,
  recordAdminActionFromRequest,
} from '@/lib/admin-notifications';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { installmentId, amountPaid, paymentDate } = await request.json();

    if (!installmentId || !amountPaid || !paymentDate) {
      return NextResponse.json(
        { message: 'هەموو زانیاریەکان پێویسن' },
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

    // Calculate new amounts
    const currentPaid = parseFloat(installment.paidAmount || '0');
    const currentRemaining = parseFloat(installment.remainingAmount || '0');
    const paymentAmount = parseFloat(amountPaid);
    
    const newPaidAmount = currentPaid + paymentAmount;
    const newRemainingAmount = Math.max(0, currentRemaining - paymentAmount);

    // Determine new status
    let newStatus = installment.status;
    if (newRemainingAmount === 0) {
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

    // Update installment
    const [updatedInstallment] = await db
      .update(installmentsTable)
      .set({
        paidAmount: newPaidAmount.toString(),
        remainingAmount: newRemainingAmount.toString(),
        status: newStatus,
      })
      .where(eq(installmentsTable.id, installmentId))
      .returning();

    // Record payment history
    const [payment] = await db
      .insert(paymentHistoryTable)
      .values({
        installmentId,
        amountPaid: amountPaid.toString(),
        paymentDate,
      })
      .returning();

    await recordAdminActionFromRequest(
      request,
      adminActionMessages.installmentPayment(
        installment.patientName,
        paymentAmount
      )
    );

    return NextResponse.json(
      { message: 'سەرکەوتووبوو', installment: updatedInstallment, payment },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error recording payment:', error);
    return NextResponse.json(
      { message: 'هەڵەیەک ڕویدا لە سروەر' },
      { status: 500 }
    );
  }
}
