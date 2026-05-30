import { NextResponse } from 'next/server';
import { db } from '@/db/drizzle';
import { transactionsTable } from '@/db/schema';
import { desc, eq, and } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const staffId = searchParams.get('staffId');
    const type = searchParams.get('type');

    const conditions = [];

    if (staffId) {
      conditions.push(eq(transactionsTable.staffId, parseInt(staffId)));
    }

    if (type) {
      conditions.push(eq(transactionsTable.type, type));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const transactions = await db
      .select()
      .from(transactionsTable)
      .where(whereClause)
      .orderBy(desc(transactionsTable.date));

    return NextResponse.json(transactions || [], { status: 200 });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { 
        message: 'هەڵە لە هێنانی لیستی تراننزاکشن',
        error: errorMessage
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { staffId, amount, type, note } = await request.json();

    if (!staffId || !amount || !type) {
      return NextResponse.json(
        { message: 'بڕی پارە، جۆر و کارمەند پێویسن' },
        { status: 400 }
      );
    }

    const transaction = await db
      .insert(transactionsTable)
      .values({
        staffId: parseInt(staffId),
        amount: amount.toString(),
        type,
        note: note || null,
        date: new Date(),
      })
      .returning();

    return NextResponse.json(
      { message: 'سەرکەوتووبوو', transaction: transaction[0] },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating transaction:', error);
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

    await db
      .delete(transactionsTable)
      .where(eq(transactionsTable.id, parseInt(id)));

    return NextResponse.json(
      { message: 'سەرکەوتووبوو' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting transaction:', error);
    return NextResponse.json(
      { message: 'هەڵەیەک ڕویدا لە سروەر' },
      { status: 500 }
    );
  }
}
