import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/drizzle';
import { usersTable } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { recordLoginNotification, formatLoginDateTime } from '@/lib/admin-notifications';
import { sendPushToAdmins } from '@/lib/send-push';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { message: 'ئیمەیڵ و وشەی نهێنی پێویسن' },
        { status: 400 }
      );
    }

    // Query user from database
    const user = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, email))
      .limit(1);

    // Check if user exists
    if (user.length === 0) {
      return NextResponse.json(
        { message: 'نەدۆزرایەوە' },
        { status: 401 }
      );
    }

    // Check password (simple comparison - in production use bcrypt or similar)
    if (user[0].password !== password) {
      return NextResponse.json(
        { message: 'وشەی نهێنی یان  ئیمەیڵ  هەڵەیە' },
        { status: 401 }
      );
    }

    const role = user[0].role || 'user';
    if (role !== 'admin') {
      await recordLoginNotification({
        userEmail: user[0].email,
        userId: user[0].id,
        method: 'email',
      });
    }

    const response = NextResponse.json(
      {
        message: 'سەرکەوتووبوو',
        email: user[0].email,
        userId: user[0].id,
      },
      { status: 200 }
    );

    // Set session cookie (expires in 7 days)
    response.cookies.set('sessionId', user[0].id.toString(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { message: 'هەڵەیەک ڕویدا لە سервەر' },
      { status: 500 }
    );
  }
}
