import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/drizzle';
import { usersTable } from '@/db/schema';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get('sessionId')?.value;
    const otpSessionCookie = request.cookies.get('session')?.value;

    // Check if logged in via OTP
    if (otpSessionCookie && !sessionCookie) {
      return NextResponse.json(
        {
          id: 0,
          email: '*****',
          isOTPLogin: true,
        },
        { status: 200 }
      );
    }

    if (!sessionCookie) {
      return NextResponse.json(
        { message: 'نەگەیشتوویت' },
        { status: 401 }
      );
    }

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

    return NextResponse.json(
      {
        id: user[0].id,
        email: user[0].email,
        isOTPLogin: false,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json(
      { message: 'هەڵەیەک ڕویدا لە سERVەر' },
      { status: 500 }
    );
  }
}
