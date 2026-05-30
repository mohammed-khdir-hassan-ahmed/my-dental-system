import { NextResponse } from 'next/server';
import { db } from '@/db/drizzle';
import { appointmentsTable } from '@/db/schema';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    const sampleAppointments = [
      {
        name: 'محەمەد علی',
        gender: 'مێر',
        phone: '07701234567',
        age: 35,
        treatmentType: 'پاکسازی دندان',
        appointmentDate: '2026-04-10',
      },
      {
        name: 'فاتیمە ئەحمەد',
        gender: 'ژن',
        phone: '07702345678',
        age: 28,
        treatmentType: 'دەندان جێگەرین',
        appointmentDate: '2026-04-11',
      },
      {
        name: 'علی حیدەر',
        gender: 'مێر',
        phone: '07703456789',
        age: 45,
        treatmentType: 'رۆت کانال',
        appointmentDate: '2026-04-12',
      },
      {
        name: 'لیندا فارس',
        gender: 'ژن',
        phone: '07704567890',
        age: 32,
        treatmentType: 'سفید کردنی دندان',
        appointmentDate: '2026-04-13',
      },
      {
        name: 'عمر عبدالله',
        gender: 'مێر',
        phone: '07705678901',
        age: 52,
        treatmentType: 'پاکسازی دندان',
        appointmentDate: '2026-04-14',
      },
      {
        name: 'امینە محمود',
        gender: 'ژن',
        phone: '07706789012',
        age: 26,
        treatmentType: 'دەندان جێگەرین',
        appointmentDate: '2026-04-15',
      },
      {
        name: 'حسین کریم',
        gender: 'مێر',
        phone: '07707890123',
        age: 40,
        treatmentType: 'رۆت کانال',
        appointmentDate: '2026-04-16',
      },
      {
        name: 'سارە ئیبراهیم',
        gender: 'ژن',
        phone: '07708901234',
        age: 31,
        treatmentType: 'سفید کردنی دندان',
        appointmentDate: '2026-04-17',
      },
    ];

    await db.insert(appointmentsTable).values(sampleAppointments);

    return NextResponse.json(
      { message: 'نموونە زانیاریەکان زیادکران بە سەرکەوتوویی', count: sampleAppointments.length },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error seeding data:', error);
    return NextResponse.json(
      { message: 'هەڵەیەک ڕویدا لە زیادکردنی نموونە زانیاریەکان' },
      { status: 500 }
    );
  }
}
