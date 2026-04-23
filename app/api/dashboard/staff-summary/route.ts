import { NextResponse } from 'next/server';
import { db } from '@/db/drizzle';
import { staffTable, transactionsTable } from '@/db/schema';
import { sql } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Get all staff
    const staff = await db.select().from(staffTable);
    
    // Get active staff
    const activeStaff = staff.filter(s => s.status === 'Active');
    const inactiveStaff = staff.filter(s => s.status === 'Inactive');
    
    // Calculate total salaries
    const totalSalaries = staff.reduce((sum, s) => sum + Number(s.basicSalary || 0), 0);
    const activeSalaries = activeStaff.reduce((sum, s) => sum + Number(s.basicSalary || 0), 0);
    
    // Get recent transactions (advances/salary payments)
    const recentTransactions = await db
      .select()
      .from(transactionsTable)
      .orderBy(sql`${transactionsTable.date} DESC`)
      .limit(5);
    
    // Calculate total advances this month
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const totalAdvances = recentTransactions
      .filter(t => t.type === 'Advance' && new Date(t.date) >= monthStart)
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);

    return NextResponse.json({
      data: {
        totalStaff: staff.length,
        activeStaff: activeStaff.length,
        inactiveStaff: inactiveStaff.length,
        totalSalaries,
        activeSalaries,
        totalAdvances,
        recentTransactions: recentTransactions.map(t => ({
          staffId: t.staffId,
          amount: Number(t.amount),
          type: t.type,
          date: t.date,
          note: t.note,
        })),
        staffList: activeStaff.map(s => ({
          id: s.id,
          fullName: s.fullName,
          role: s.role,
          basicSalary: Number(s.basicSalary || 0),
          status: s.status,
        })),
      },
    });
  } catch (error) {
    console.error('Error fetching staff summary:', error);
    return NextResponse.json(
      { message: 'هەڵە لە هێنانی زانیاری کارمەندان' },
      { status: 500 }
    );
  }
}
