import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/drizzle';
import { installmentsTable, paymentHistoryTable } from '@/db/schema';
import { desc, eq } from 'drizzle-orm';
import {
  adminActionMessages,
  recordAdminActionFromRequest,
} from '@/lib/admin-notifications';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const installments = await db
      .select()
      .from(installmentsTable)
      .orderBy(desc(installmentsTable.createdAt));

    const paymentHistory = await db
      .select()
      .from(paymentHistoryTable)
      .orderBy(desc(paymentHistoryTable.paymentDate));

    // Attach payment history to each installment
    const installmentsWithHistory = installments.map(installment => {
      const history = paymentHistory
        .filter(ph => ph.installmentId === installment.id)
        .map(ph => ({
          paymentDate: ph.paymentDate,
          amountPaid: ph.amountPaid
        }));

      const remainingAmount = parseFloat(installment.remainingAmount as string || '0');
      let status = installment.status;

      if (remainingAmount === 0) {
        status = 'Paid';
      } else if (installment.nextPaymentDate) {
        const nextPaymentDate = new Date(installment.nextPaymentDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        nextPaymentDate.setHours(0, 0, 0, 0);
        
        if (nextPaymentDate < today && remainingAmount > 0) {
          status = 'Overdue';
        }
      }

      return {
        ...installment,
        status,
        paymentHistory: history.length > 0 ? history : undefined
      };
    });

    return NextResponse.json(installmentsWithHistory, { status: 200 });
  } catch (error) {
    console.error('Error fetching installments:', error);
    return NextResponse.json(
      { message: 'هەڵە لە هێنانی قیستەکان' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { patientName, totalAmount, paidAmount, remainingAmount, installmentValue, nextPaymentDate, age, phoneNumber, address } =
      await request.json();

    if (!patientName || !totalAmount || !remainingAmount || !installmentValue) {
      return NextResponse.json(
        { message: 'هەموو زانیاریەکان پێویسن' },
        { status: 400 }
      );
    }

    const installment = await db
      .insert(installmentsTable)
      .values({
        patientName,
        totalAmount: totalAmount.toString(),
        paidAmount: paidAmount ? paidAmount.toString() : '0',
        remainingAmount: remainingAmount.toString(),
        installmentValue: installmentValue.toString(),
        nextPaymentDate: nextPaymentDate || null,
        status: parseFloat(remainingAmount) === 0 ? 'Paid' : 'Pending',
        age: age || null,
        phoneNumber: phoneNumber || null,
        address: address || null,
      })
      .returning();

    await recordAdminActionFromRequest(
      request,
      adminActionMessages.installmentAdded(patientName)
    );

    return NextResponse.json(
      { message: 'سەرکەوتووبوو', installment: installment[0] },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating installment:', error);
    return NextResponse.json(
      { message: 'هەڵەیەک ڕویدا لە سروەر' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const { id, patientName, totalAmount, paidAmount, remainingAmount, installmentValue, nextPaymentDate, status, age, phoneNumber, address } =
      await request.json();

    if (!id) {
      return NextResponse.json(
        { message: 'ئیدی پێویستە' },
        { status: 400 }
      );
    }

    const [installment] = await db
      .update(installmentsTable)
      .set({
        patientName,
        totalAmount: totalAmount.toString(),
        paidAmount: paidAmount ? paidAmount.toString() : '0',
        remainingAmount: remainingAmount.toString(),
        installmentValue: installmentValue.toString(),
        nextPaymentDate: nextPaymentDate || null,
        status: status || 'Pending',
        age: age || null,
        phoneNumber: phoneNumber || null,
        address: address || null,
      })
      .where(eq(installmentsTable.id, parseInt(id)))
      .returning();

    return NextResponse.json(
      { message: 'سەرکەوتووبوو', installment },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error updating installment:', error);
    return NextResponse.json(
      { message: 'هەڵەیەک ڕویدا لە سروەر' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { message: 'ئیدی پێویستە' },
        { status: 400 }
      );
    }

    const [existing] = await db
      .select()
      .from(installmentsTable)
      .where(eq(installmentsTable.id, parseInt(id)))
      .limit(1);

    // Delete related payment history first to avoid foreign key constraint
    await db
      .delete(paymentHistoryTable)
      .where(eq(paymentHistoryTable.installmentId, parseInt(id)));

    await db
      .delete(installmentsTable)
      .where(eq(installmentsTable.id, parseInt(id)));

    if (existing) {
      await recordAdminActionFromRequest(
        request,
        adminActionMessages.installmentDeleted(existing.patientName)
      );
    }

    return NextResponse.json(
      { message: 'سەرکەوتووبوو' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting installment:', error);
    return NextResponse.json(
      { message: 'هەڵەیەک ڕویدا لە سروەر' },
      { status: 500 }
    );
  }
}
