import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import { config } from 'dotenv';

config();

const sql = neon(process.env.DATABASE_URL!);

export const dynamic = 'force-dynamic';

export async function PUT(request: NextRequest) {
  try {
    const otpSessionCookie = request.cookies.get('session')?.value;

    if (!otpSessionCookie) {
      return NextResponse.json(
        { message: 'نەگەیشتوویت' },
        { status: 401 }
      );
    }

    const { currentCode, newCode } = await request.json();

    if (!currentCode || !newCode) {
      return NextResponse.json(
        { message: 'کۆدی ئێستا و نوێ پێویسن' },
        { status: 400 }
      );
    }

    if (!/^\d{6}$/.test(newCode)) {
      return NextResponse.json(
        { message: 'کۆدی نوێ دەبێت تەنها ٦ ژمارە بێت' },
        { status: 400 }
      );
    }

    // Verify current code exists
    const currentCodeCheck = await sql`
      SELECT * FROM otpcode WHERE code = ${currentCode}
    `;

    if (currentCodeCheck.length === 0) {
      return NextResponse.json(
        { message: 'کۆدی ئێستا هەڵەیە' },
        { status: 400 }
      );
    }

    // Check if new code already exists
    const newCodeCheck = await sql`
      SELECT * FROM otpcode WHERE code = ${newCode}
    `;

    if (newCodeCheck.length > 0) {
      return NextResponse.json(
        { message: 'کۆدی نوێ پێشتر هەیە' },
        { status: 400 }
      );
    }

    // Update the code
    await sql`
      UPDATE otpcode SET code = ${newCode} WHERE code = ${currentCode}
    `;

    return NextResponse.json(
      { message: 'کۆدی تایبەت بە سەرکەوتوویی گۆڕا' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Update OTP code error:', error);
    return NextResponse.json(
      { message: 'هەڵەیەک ڕویدا لە سERVەر' },
      { status: 500 }
    );
  }
}
