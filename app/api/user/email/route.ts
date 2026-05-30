import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/drizzle';
import { usersTable } from '@/db/schema';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function PUT(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get('sessionId')?.value;

    if (!sessionCookie) {
      return NextResponse.json(
        { message: 'نەگەیشتوویت' },
        { status: 401 }
      );
    }

    const { email, currentEmail } = await request.json();

    if (!email || !currentEmail) {
      return NextResponse.json(
        { message: 'ئیمەیڵی نوێ و ئیمەیڵی ئێستا پێویسن' },
        { status: 400 }
      );
    }

    // Verify current email matches
    const user = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, parseInt(sessionCookie)))
      .limit(1);

    if (user.length === 0) {
      return NextResponse.json(
        { message: 'بەکارهێنەر نەدۆزرایەوە' },
        { status: 404 }
      );
    }

    if (user[0].email !== currentEmail) {
      return NextResponse.json(
        { message: 'ئیمەیڵی ئێستا هەڵەیە' },
        { status: 400 }
      );
    }

    // Update email
    await db
      .update(usersTable)
      .set({ email })
      .where(eq(usersTable.id, parseInt(sessionCookie)));

    return NextResponse.json(
      { message: 'ئیمەیڵ بە سەرکەوتوویی گۆڕا' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Update email error:', error);
    return NextResponse.json(
      { message: 'هەڵەیەک ڕویدا لە سERVەر' },
      { status: 500 }
    );
  }
}
