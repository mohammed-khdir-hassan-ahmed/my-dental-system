import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionUser(request);

    if (!session) {
      return NextResponse.json(
        { message: 'نەگەیشتوویت' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        id: session.id,
        email: session.email,
        role: session.role,
        permissions: session.permissions,
        isAdmin: session.isAdmin,
        isOTPLogin: session.isOTPLogin,
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
