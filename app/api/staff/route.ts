import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/drizzle';
import { staffTable } from '@/db/schema';
import { desc, eq } from 'drizzle-orm';
import {
  adminActionMessages,
  recordAdminActionFromRequest,
} from '@/lib/admin-notifications';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const staff = await db
      .select()
      .from(staffTable)
      .orderBy(desc(staffTable.createdAt));

    return NextResponse.json(staff || [], { status: 200 });
  } catch (error) {
    console.error('Error fetching staff:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { 
        message: 'هەڵە لە هێنانی لیستی کاری هاوڕێ',
        error: errorMessage
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { fullName, role, phonenumber, basicSalary, age, address, status, date } = await request.json();

    if (!fullName || !role || !phonenumber) {
      return NextResponse.json(
        { message: 'ناو، پلە و ژمارە تێلیفۆن پێویسن' },
        { status: 400 }
      );
    }

    const staffMember = await db
      .insert(staffTable)
      .values({
        fullName,
        role,
        phonenumber,
        basicSalary: basicSalary ? basicSalary.toString() : '0',
        age: age || null,
        address: address || null,
        status: status || 'Active',
        date: new Date().toISOString().split('T')[0],
      })
      .returning();

    await recordAdminActionFromRequest(
      request,
      adminActionMessages.staffAdded(fullName)
    );

    return NextResponse.json(
      { message: 'سەرکەوتووبوو', staff: staffMember[0] },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating staff member:', error);
    return NextResponse.json(
      { message: 'هەڵەیەک ڕویدا لە سروەر' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { message: 'ئیدی پێویستە' },
        { status: 400 }
      );
    }

    const [existing] = await db
      .select()
      .from(staffTable)
      .where(eq(staffTable.id, parseInt(id)))
      .limit(1);

    await db
      .delete(staffTable)
      .where(eq(staffTable.id, parseInt(id)));

    if (existing) {
      await recordAdminActionFromRequest(request, adminActionMessages.staffDeleted());
    }

    return NextResponse.json(
      { message: 'سەرکەوتووبوو' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting staff member:', error);
    return NextResponse.json(
      { message: 'هەڵەیەک ڕویدا لە سروەر' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { id, fullName, role, phonenumber, basicSalary, age, address, status } = await request.json();

    if (!id) {
      return NextResponse.json(
        { message: 'ئیدی پێویستە' },
        { status: 400 }
      );
    }

    if (!fullName || !role || !phonenumber) {
      return NextResponse.json(
        { message: 'ناو، پلە و ژمارە تێلیفۆن پێویسن' },
        { status: 400 }
      );
    }

    const updated = await db
      .update(staffTable)
      .set({
        fullName,
        role,
        phonenumber,
        basicSalary: basicSalary ? basicSalary.toString() : '0',
        age: age || null,
        address: address || null,
        status: status || 'Active',
      })
      .where(eq(staffTable.id, Number(id)))
      .returning();

    await recordAdminActionFromRequest(
      request,
      adminActionMessages.staffUpdated(fullName)
    );

    return NextResponse.json(
      { message: 'سەرکەوتووبوو', staff: updated[0] },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error updating staff member:', error);
    return NextResponse.json(
      { message: 'هەڵەیەک ڕویدا لە سروەر' },
      { status: 500 }
    );
  }
}
