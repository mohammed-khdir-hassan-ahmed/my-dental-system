import { db } from '@/db/drizzle';
import { NextRequest, NextResponse } from 'next/server';
import {
  expensesTable,
  installmentsTable,
  appointmentsTable,
  staffTable,
  monthlyRecordsTable,
  payrollHistoryTable,
  transactionsTable,
  salesTable,
  paymentHistoryTable,
  usersTable,
  adminNotificationsTable,
  pushSubscriptionsTable,
  advanceRequestsTable,
} from '@/db/schema';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Fetch all data from all tables
    const [
      expenses,
      installments,
      appointments,
      staff,
      monthlyRecords,
      payrollHistory,
      transactions,
      advanceRequests,
      sales,
      paymentHistory,
      users,
      adminNotifications,
      pushSubscriptions,
    ] = await Promise.all([
      db.select().from(expensesTable),
      db.select().from(installmentsTable),
      db.select().from(appointmentsTable),
      db.select().from(staffTable),
      db.select().from(monthlyRecordsTable),
      db.select().from(payrollHistoryTable),
      db.select().from(transactionsTable),
      db.select().from(advanceRequestsTable),
      db.select().from(salesTable),
      db.select().from(paymentHistoryTable),
      db.select().from(usersTable),
      db.select().from(adminNotificationsTable),
      db.select().from(pushSubscriptionsTable),
    ]);

    const backupData = {
      version: '1.0',
      generatedAt: new Date().toISOString(),
      data: {
        expenses,
        installments,
        appointments,
        staff,
        monthlyRecords,
        payrollHistory,
        transactions,
        advanceRequests,
        sales,
        paymentHistory,
        users,
        adminNotifications,
        pushSubscriptions,
      },
    };

    // Set headers for file download
    const filename = `dental-system-backup-${new Date().toISOString().split('T')[0]}.json`;
    return new NextResponse(JSON.stringify(backupData, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Backup error:', error);
    return NextResponse.json(
      { message: 'هەڵەیەک ڕویدا لە دروستکردنی بەکاپ' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const backupData = await request.json();
    
    // Validate basic structure
    if (!backupData.version || !backupData.data) {
      return NextResponse.json(
        { message: 'دەیتای بەکاپ نەگەرایەوە' },
        { status: 400 }
      );
    }

    // Restore data table by table (we'll insert and ignore errors for existing IDs)
    // Note: For a full restore, you might want to clear tables first, but let's do safe restore
    const { data } = backupData;

    // Restore users (skip passwords or handle carefully)
    if (data.users?.length > 0) {
      for (const user of data.users) {
        try {
          await db.insert(usersTable).values(user).onConflictDoNothing();
        } catch (e) {
          console.warn('Skipping user:', user.id, e);
        }
      }
    }

    if (data.staff?.length > 0) {
      for (const staffMember of data.staff) {
        try {
          await db.insert(staffTable).values(staffMember).onConflictDoNothing();
        } catch (e) {
          console.warn('Skipping staff:', staffMember.id, e);
        }
      }
    }

    if (data.expenses?.length > 0) {
      for (const expense of data.expenses) {
        try {
          await db.insert(expensesTable).values(expense).onConflictDoNothing();
        } catch (e) {
          console.warn('Skipping expense:', expense.id, e);
        }
      }
    }

    if (data.appointments?.length > 0) {
      for (const appointment of data.appointments) {
        try {
          await db.insert(appointmentsTable).values(appointment).onConflictDoNothing();
        } catch (e) {
          console.warn('Skipping appointment:', appointment.id, e);
        }
      }
    }

    if (data.installments?.length > 0) {
      for (const installment of data.installments) {
        try {
          await db.insert(installmentsTable).values(installment).onConflictDoNothing();
        } catch (e) {
          console.warn('Skipping installment:', installment.id, e);
        }
      }
    }

    if (data.paymentHistory?.length > 0) {
      for (const payment of data.paymentHistory) {
        try {
          await db.insert(paymentHistoryTable).values(payment).onConflictDoNothing();
        } catch (e) {
          console.warn('Skipping payment history:', payment.id, e);
        }
      }
    }

    if (data.sales?.length > 0) {
      for (const sale of data.sales) {
        try {
          await db.insert(salesTable).values(sale).onConflictDoNothing();
        } catch (e) {
          console.warn('Skipping sale:', sale.id, e);
        }
      }
    }

    if (data.monthlyRecords?.length > 0) {
      for (const record of data.monthlyRecords) {
        try {
          await db.insert(monthlyRecordsTable).values(record).onConflictDoNothing();
        } catch (e) {
          console.warn('Skipping monthly record:', record.id, e);
        }
      }
    }

    if (data.payrollHistory?.length > 0) {
      for (const record of data.payrollHistory) {
        try {
          await db.insert(payrollHistoryTable).values(record).onConflictDoNothing();
        } catch (e) {
          console.warn('Skipping payroll history:', record.id, e);
        }
      }
    }

    if (data.transactions?.length > 0) {
      for (const record of data.transactions) {
        try {
          await db.insert(transactionsTable).values(record).onConflictDoNothing();
        } catch (e) {
          console.warn('Skipping transaction:', record.id, e);
        }
      }
    }

    if (data.advanceRequests?.length > 0) {
      for (const request of data.advanceRequests) {
        try {
          await db.insert(advanceRequestsTable).values(request).onConflictDoNothing();
        } catch (e) {
          console.warn('Skipping advance request:', request.id, e);
        }
      }
    }

    if (data.adminNotifications?.length > 0) {
      for (const notification of data.adminNotifications) {
        try {
          await db.insert(adminNotificationsTable).values(notification).onConflictDoNothing();
        } catch (e) {
          console.warn('Skipping admin notification:', notification.id, e);
        }
      }
    }

    if (data.pushSubscriptions?.length > 0) {
      for (const sub of data.pushSubscriptions) {
        try {
          await db.insert(pushSubscriptionsTable).values(sub).onConflictDoNothing();
        } catch (e) {
          console.warn('Skipping push subscription:', sub.id, e);
        }
      }
    }

    return NextResponse.json({ message: 'دەیتاکان بە سەرکەوتوویی گەڕانەوەکران' });
  } catch (error) {
    console.error('Restore error:', error);
    return NextResponse.json(
      { message: 'هەڵەیەک ڕویدا لە گەڕانەوەی دەیتاکان' },
      { status: 500 }
    );
  }
}
