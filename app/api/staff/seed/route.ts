import { NextResponse } from 'next/server';
import { db } from '@/db/drizzle';
import { staffTable } from '@/db/schema';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    const sampleStaff = [
      {
        fullName: 'محەمەد علی',
        role: 'پزیشک',
        phonenumber: '07701234567',
        basicSalary: '800000',
        age: 35,
        address: 'جادەی ناسناسن، ئاربیل',
        status: 'Active',
        date: '2024-01-15',
      },
      {
        fullName: 'فاتیمە احمەد',
        role: 'یاریدەدەر',
        phonenumber: '07702345678',
        basicSalary: '750000',
        age: 28,
        address: 'قەشلەگە، ئاربیل',
        status: 'Active',
        date: '2024-02-20',
      },
      {
        fullName: 'علی حیدەر',
        role: 'پزیشکی ددان',
        phonenumber: '07703456789',
        basicSalary: '900000',
        age: 42,
        address: 'بێباخ، ئاربیل',
        status: 'Active',
        date: '2023-06-10',
      },
      {
        fullName: 'لیندا فارس',
        role: 'پەرستار',
        phonenumber: '07704567890',
        basicSalary: '700000',
        age: 26,
        address: 'ئاینجیرە، ئاربیل',
        status: 'Active',
        date: '2024-03-05',
      },
      {
        fullName: 'عمر عبدالله',
        role: 'کارگێر',
        phonenumber: '07705678901',
        basicSalary: '850000',
        age: 38,
        address: 'گێدێ سکینەی، ئاربیل',
        status: 'Inactive',
        date: '2023-11-22',
      },
    ];

    const insertedStaff = await db.insert(staffTable).values(sampleStaff).returning();

    return NextResponse.json(
      {
        message: '5 کاری هاوڕێی مۆکەپ بەسەرکەوتویی زیاد کران',
        staff: insertedStaff,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error seeding staff:', error);
    return NextResponse.json(
      { message: 'هەڵەیەک ڕویدا لە سروەر' },
      { status: 500 }
    );
  }
}
