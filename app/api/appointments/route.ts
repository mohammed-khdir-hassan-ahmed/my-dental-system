import { NextResponse } from 'next/server';
import { db } from '@/db/drizzle';
import { appointmentsTable } from '@/db/schema';
import { desc, eq, and, gte, lt } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

function getMonthStart(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function getNextMonthStart(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 1);
}

function toDateOnly(date: Date) {
  return date.toISOString().slice(0, 10);
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || 'month'
    const from = searchParams.get('from')
    const to = searchParams.get('to')

    const now = new Date();
    let startDate: Date
    let endDate: Date

    if (from && to) {
      startDate = new Date(from)
      endDate = new Date(to)
    } else if (period === 'today') {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
    } else if (period === 'week') {
      const dayOfWeek = now.getDay()
      const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1)
      startDate = new Date(now.getFullYear(), now.getMonth(), diff)
      endDate = new Date(now.getFullYear(), now.getMonth(), diff + 7)
    } else if (period === 'all') {
      startDate = new Date(0)
      endDate = new Date()
    } else {
      startDate = getMonthStart(now)
      endDate = getNextMonthStart(now)
    }

    const startDateStr = toDateOnly(startDate)
    const endDateStr = toDateOnly(endDate)

    let appointments;
    if (period === 'all' && !from && !to) {
      appointments = await db
        .select()
        .from(appointmentsTable)
        .orderBy(desc(appointmentsTable.createdAt));
    } else {
      appointments = await db
        .select()
        .from(appointmentsTable)
        .where(
          and(
            gte(appointmentsTable.appointmentDate, startDateStr),
            lt(appointmentsTable.appointmentDate, endDateStr)
          )
        )
        .orderBy(desc(appointmentsTable.createdAt));
    }

    return NextResponse.json(appointments, { status: 200 });
  } catch (error) {
    console.error('Error fetching appointments:', error);
    return NextResponse.json(
      { message: 'هەڵە لە هێنانی نووسینی دانگی' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { name, gender, phone, age, treatmentType, appointmentDate, money } =
      await request.json();

    if (!name || !gender || !phone || !age || !treatmentType || !appointmentDate) {
      return NextResponse.json(
        { message: 'هەموو زانیاریەکان پێویسن' },
        { status: 400 }
      );
    }

    const appointment = await db
      .insert(appointmentsTable)
      .values({
        name,
        gender,
        phone,
        age,
        treatmentType,
        appointmentDate,
        money: money ? money.toString() : '0',
      })
      .returning();

    return NextResponse.json(
      { message: 'سەرکەوتووبوو', appointment: appointment[0] },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating appointment:', error);
    return NextResponse.json(
      { message: 'هەڵەیەک ڕویدا لە سروەر' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const { id, name, gender, phone, age, treatmentType, appointmentDate, money } =
      await request.json();

    if (!id) {
      return NextResponse.json(
        { message: 'ئیدی پێویستە' },
        { status: 400 }
      );
    }

    if (!name || !gender || !phone || !age || !treatmentType || !appointmentDate) {
      return NextResponse.json(
        { message: 'هەموو زانیاریەکان پێویسن' },
        { status: 400 }
      );
    }

    const [appointment] = await db
      .update(appointmentsTable)
      .set({
        name,
        gender,
        phone,
        age,
        treatmentType,
        appointmentDate,
        money: money ? money.toString() : '0',
      })
      .where(eq(appointmentsTable.id, parseInt(id)))
      .returning();

    return NextResponse.json(
      { message: 'سەرکەوتووبوو', appointment },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error updating appointment:', error);
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
      .delete(appointmentsTable)
      .where(eq(appointmentsTable.id, parseInt(id)));

    return NextResponse.json(
      { message: 'سەرکەوتووبوو' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting appointment:', error);
    return NextResponse.json(
      { message: 'هەڵەیەک ڕویدا لە سروەر' },
      { status: 500 }
    );
  }
}
