import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import { config } from 'dotenv';
import { recordLoginNotification, formatLoginDateTime } from '@/lib/admin-notifications';
import { sendPushToAdmins } from '@/lib/send-push';

config();

const sql = neon(process.env.DATABASE_URL!);

export async function POST(request: Request) {
  try {
    const { code } = await request.json();

    if (!code) {
      return NextResponse.json(
        { error: 'کۆد داواکراوە' },
        { status: 400 }
      );
    }

    // Check if the code exists in the otpcode table
    const result = await sql`
      SELECT * FROM otpcode WHERE code = ${code}
    `;

    if (result.length === 0) {
      return NextResponse.json(
        { error: 'کۆدی تایبەت هەڵەیە' },
        { status: 401 }
      );
    }

    await recordLoginNotification({
      userEmail: 'بەکارهێنەری کۆدی تایبەت',
      method: 'otp',
    });

    // نێردنی push notification بۆ مۆبایلی ئەدمین
    const { combined } = formatLoginDateTime(new Date());
    const pushResult = await sendPushToAdmins({
      title: '🔑 چوونەژوورەوەی نوێ (کۆدی تایبەت)',
      body: `بەکارهێنەرێک بە کۆدی تایبەت چووە ژوورەوە\n${combined}`,
      tag: 'login-otp-' + Date.now(),
    });
    if (!pushResult.vapidConfigured || pushResult.subscriptionsFound === 0 || pushResult.sent === 0) {
      console.warn('Push delivery check (login-otp):', pushResult);
    }

    // If code is valid, create a session cookie
    const response = NextResponse.json(
      { success: true, message: 'چونەژوورەوە سەرکەوتوو بوو' },
      { status: 200 }
    );

    // Set a session cookie
    response.cookies.set('session', 'authenticated', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 1 week
    });

    return response;
  } catch (error) {
    console.error('OTP login error:', error);
    return NextResponse.json(
      { error: 'هەڵەیەک ڕویدا لە سێرڤەر' },
      { status: 500 }
    );
  }
}
