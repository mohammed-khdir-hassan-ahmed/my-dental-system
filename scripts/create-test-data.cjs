const { db } = require('@/db/drizzle');
const { staffTable, monthlyRecordsTable, payrollHistoryTable } = require('@/db/schema');

// بيانات موظفين وهمية
const testStaff = [
  {
    fullName: 'محمد علي',
    role: 'پەرستار',
    phonenumber: '07701234567',
    basicSalary: '800000',
    age: 28,
    address: 'هەولیر',
    status: 'Active',
  },
  {
    fullName: 'فاتیمە مراد',
    role: 'دەندان پزیشک',
    phonenumber: '07702234567',
    basicSalary: '2000000',
    age: 35,
    address: 'هەولیر',
    status: 'Active',
  },
  {
    fullName: 'حسن کریم',
    role: 'تێکنیشین',
    phonenumber: '07703234567',
    basicSalary: '600000',
    age: 25,
    address: 'سلێمانی',
    status: 'Active',
  },
  {
    fullName: 'نور محمد',
    role: 'پەرستار',
    phonenumber: '07704234567',
    basicSalary: '750000',
    age: 30,
    address: 'هەولیر',
    status: 'Active',
  },
  {
    fullName: 'سارا حسن',
    role: 'سەکرتێر',
    phonenumber: '07705234567',
    basicSalary: '500000',
    age: 26,
    address: 'هەولیر',
    status: 'Active',
  },
];

// فنکشن لتولید بيانات شهرية
async function generateMonthlyData() {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  // بيانات آخر 6 شهور
  const months = [];
  for (let i = 5; i >= 0; i--) {
    let month = currentMonth - i;
    let year = currentYear;

    if (month <= 0) {
      month += 12;
      year -= 1;
    }

    const monthKey = `${String(month).padStart(2, '0')}-${year}`;
    months.push({ month, year, monthKey });
  }

  // الموظفين المضافین
  let staffMembers = await db.select().from(staffTable);

  if (staffMembers.length === 0) {
    console.log('عدم وجود موظفين. يضيف الموظفين أولاً...');
    const inserted = await db
      .insert(staffTable)
      .values(testStaff)
      .returning();
    staffMembers = inserted;
  }

  console.log(`✅ عدد الموظفين: ${staffMembers.length}`);

  // إضافة سجلات شهرية
  for (const { month, year, monthKey } of months) {
    // إضافة بيانات الموظفين لكل شهر
    for (const staff of staffMembers) {
      const basicSalary = parseFloat(staff.basicSalary || '0');

      // إنشاء تاریخ عشوائي في الشهر
      const dayInMonth = Math.floor(Math.random() * 28) + 1;
      const recordDate = new Date(year, month - 1, dayInMonth);

      // سجل الراتب
      await db
        .insert(monthlyRecordsTable)
        .values({
          staffId: staff.id,
          amount: (basicSalary * (0.8 + Math.random() * 0.4)).toString(),
          type: 'Salary',
          date: recordDate,
          monthKey: monthKey,
          isPaid: true,
          note: `موچەی ${monthKey}`,
        })
        .onConflictDoNothing();

      // سجل المقدم (ربما)
      if (Math.random() > 0.5) {
        await db
          .insert(monthlyRecordsTable)
          .values({
            staffId: staff.id,
            amount: ((basicSalary * 0.3) * Math.random()).toString(),
            type: 'Advance',
            date: new Date(year, month - 1, Math.floor(Math.random() * 20) + 1),
            monthKey: monthKey,
            isPaid: false,
            note: `پێشەکی ${monthKey}`,
          })
          .onConflictDoNothing();
      }
    }

    // إضافة سجل السجل المالي للشهر
    const totalSalary = staffMembers.reduce(
      (sum, s) => sum + parseFloat(s.basicSalary || '0') * 0.9,
      0
    );
    const totalAdvances = staffMembers.length * 50000;

    await db
      .insert(payrollHistoryTable)
      .values({
        monthKey: monthKey,
        year: year,
        month: month,
        totalSalaryPaid: totalSalary.toString(),
        totalAdvances: totalAdvances.toString(),
        totalStaff: staffMembers.length,
      })
      .onConflictDoNothing();

    console.log(`✅ تمت إضافة بيانات الشهر: ${monthKey}`);
  }

  console.log('\n✨ اكتمل التصدير بنجاح!');
  console.log(`✅ عدد الموظفين: ${staffMembers.length}`);
  console.log(`✅ عدد الشهور: ${months.length}`);
  console.log('✅ الشهور المضافة:');
  months.forEach((m) => console.log(`   - ${m.monthKey}`));
}

// تشغيل السكريبت
generateMonthlyData()
  .then(() => {
    console.log('\n✨ اكتمل بنجاح!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ خطأ:', error.message);
    process.exit(1);
  });
