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

    const { currentPassword, newPassword } = await request.json();

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { message: 'وشەی نهێنی ئێستا و نوێ پێویسن' },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { message: 'وشەی نهێنی نوێ دەبێت لە 6 پیت زیاتر بێت' },
        { status: 400 }
      );
    }

    // Verify current password
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

    if (user[0].password !== currentPassword) {
      return NextResponse.json(
        { message: 'وشەی نهێنی ئێستا هەڵەیە' },
        { status: 400 }
      );
    }

    // Update password
    await db
      .update(usersTable)
      .set({ password: newPassword })
      .where(eq(usersTable.id, parseInt(sessionCookie)));

    return NextResponse.json(
      { message: 'وشەی نهێنی بە سەرکەوتوویی گۆڕا' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Update password error:', error);
    return NextResponse.json(
      { message: 'هەڵەیەک ڕویدا لە سERVەر' },
      { status: 500 }
    );
  }
}
