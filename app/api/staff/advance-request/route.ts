import { NextResponse } from 'next/server';
import { db } from '@/db/drizzle';
import { advanceRequestsTable } from '@/db/schema';
import { desc, eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const requests = await db
      .select()
      .from(advanceRequestsTable)
      .orderBy(desc(advanceRequestsTable.createdAt));

    return NextResponse.json(requests, { status: 200 });
  } catch (error) {
    console.error('Error fetching advance requests:', error);
    return NextResponse.json(
      { message: 'هەڵە لە هێنانی داواکاریەکان' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { staffId, amount, reason, neededByDate } = await request.json();

    if (!staffId || !amount) {
      return NextResponse.json(
        { message: 'ئیدی کارمەندی و بڕی پێویسن' },
        { status: 400 }
      );
    }

    const advanceRequest = await db
      .insert(advanceRequestsTable)
      .values({
        staffId,
        amount: amount.toString(),
        reason: reason || null,
        neededByDate: neededByDate || null,
      })
      .returning();

    return NextResponse.json(
      { message: 'داواکاری پێش درێژە بەسەرکەوتویی کۆتایی پێهات', request: advanceRequest[0] },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating advance request:', error);
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
      .delete(advanceRequestsTable)
      .where(eq(advanceRequestsTable.id, parseInt(id)));

    return NextResponse.json(
      { message: 'سەرکەوتووبوو' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting advance request:', error);
    return NextResponse.json(
      { message: 'هەڵەیەک ڕویدا لە سروەر' },
      { status: 500 }
    );
  }
}
