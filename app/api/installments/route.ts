import { NextResponse } from 'next/server';
import { db } from '@/db/drizzle';
import { installmentsTable, paymentHistoryTable } from '@/db/schema';
import { desc, eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const installments = await db
      .select()
      .from(installmentsTable)
      .orderBy(desc(installmentsTable.createdAt));

    // Calculate automatic status for each installment
    const updatedInstallments = installments.map(installment => {
      const remainingAmount = parseFloat(installment.remainingAmount as string || '0');
      if (remainingAmount === 0) {
        return { ...installment, status: 'Paid' };
      }
      if (installment.nextPaymentDate) {
        const nextPaymentDate = new Date(installment.nextPaymentDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        nextPaymentDate.setHours(0, 0, 0, 0);
        
        if (nextPaymentDate < today && remainingAmount > 0) {
          return { ...installment, status: 'Overdue' };
        }
      }
      return installment;
    });

    return NextResponse.json(updatedInstallments, { status: 200 });
  } catch (error) {
    console.error('Error fetching installments:', error);
    return NextResponse.json(
      { message: 'هەڵە لە هێنانی قیستەکان' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { patientName, totalAmount, paidAmount, remainingAmount, installmentValue, nextPaymentDate } =
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
      })
      .returning();

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
    const { id, patientName, totalAmount, paidAmount, remainingAmount, installmentValue, nextPaymentDate, status } =
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

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { message: 'ئیدی پێویستە' },
        { status: 400 }
      );
    }

    // Delete related payment history first to avoid foreign key constraint
    await db
      .delete(paymentHistoryTable)
      .where(eq(paymentHistoryTable.installmentId, parseInt(id)));

    await db
      .delete(installmentsTable)
      .where(eq(installmentsTable.id, parseInt(id)));

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
