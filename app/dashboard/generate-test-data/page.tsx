'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Loader2, CheckCircle2 } from 'lucide-react';
import { notifyTestDataGenerated, notifyActionError } from '@/lib/notify';

export default function GenerateTestDataPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleGenerateTestData = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/generate-test-data', {
        method: 'POST',
      });

      const data = await response.json();

      if (response.ok) {
        setResult(data);
        notifyTestDataGenerated();
      } else {
        notifyActionError(data.error || 'هەڵە لە زیادکردنی داتا');
      }
    } catch (error) {
      notifyActionError('هەڵە لە پەیوەندی بە سێرڤەر');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-2xl" dir="rtl">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold mb-2">تولید البيانات الوهمية للاختبار</h1>
          <p className="text-gray-600 dark:text-gray-400">
            انقر الزر أدناه لإضافة موظفين وشهور بيانات اختبارية للنظام
          </p>
        </div>

        {/* Instructions */}
        <Card className="p-6 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
          <h2 className="font-semibold mb-3 text-blue-900 dark:text-blue-100">سيتم إضافة:</h2>
          <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
            <li>✅ 5 موظفين وهميين (محمد علي، فاتيمة مراد، حسن كريم، نور محمد، سارا حسن)</li>
            <li>✅ 6 شهور من البيانات التاريخية (الشهور الماضية)</li>
            <li>✅ سجلات رواتب ومقدمات لكل موظف</li>
            <li>✅ بيانات تاريخ الرواتب لكل شهر</li>
          </ul>
        </Card>

        {/* Generate Button */}
        <Button
          onClick={handleGenerateTestData}
          disabled={loading}
          className="w-full bg-primary hover:shadow-lg hover:shadow-primary/30 active:scale-95 active:shadow-inner text-white font-semibold transition-all duration-150 h-12"
        >
          {loading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
              جاري الإضافة...
            </>
          ) : (
            <>
              <CheckCircle2 className="h-5 w-5 mr-2" />
              إضافة البيانات الوهمية
            </>
          )}
        </Button>

        {/* Results */}
        {result && (
          <Card className="p-6 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
            <div className="space-y-3">
              <h3 className="font-bold text-green-900 dark:text-green-100 flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5" />
                النتائج:
              </h3>
              <div className="space-y-2 text-sm text-green-800 dark:text-green-200">
                <p>✅ عدد الموظفين المضافين: <span className="font-bold">{result.staffCount}</span></p>
                <p>✅ عدد الشهور: <span className="font-bold">{result.monthsCount}</span></p>
                <p>✅ عدد السجلات: <span className="font-bold">{result.recordsAdded}</span></p>
                <div className="mt-3">
                  <p className="font-semibold mb-2">الشهور المضافة:</p>
                  <div className="flex flex-wrap gap-2">
                    {result.months?.map((month: string) => (
                      <span key={month} className="px-3 py-1 bg-green-200 dark:bg-green-800 rounded-full text-xs">
                        {month}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* How to Test */}
        <Card className="p-6">
          <h2 className="font-semibold mb-4">كيفية الاختبار:</h2>
          <ol className="space-y-3 text-sm">
            <li className="flex gap-3">
              <span className="font-bold text-primary">1.</span>
              <span>انقر الزر "إضافة البيانات الوهمية" أعلاه</span>
            </li>
            <li className="flex gap-3">
              <span className="font-bold text-primary">2.</span>
              <span>انتظر حتى تظهر رسالة النجاح</span>
            </li>
            <li className="flex gap-3">
              <span className="font-bold text-primary">3.</span>
              <span>اذهب إلى <span className="font-mono bg-gray-100 dark:bg-gray-900 px-2 py-1 rounded">داشبورد → كارمندەكان</span> لترى الموظفين الوهميين</span>
            </li>
            <li className="flex gap-3">
              <span className="font-bold text-primary">4.</span>
              <span>اذهب إلى <span className="font-mono bg-gray-100 dark:bg-gray-900 px-2 py-1 rounded">كارمندەكان → ڕاپۆرتی موچە</span> واختر شهراً مختلفاً</span>
            </li>
            <li className="flex gap-3">
              <span className="font-bold text-primary">5.</span>
              <span>سترى البيانات التاريخية للشهور السابقة</span>
            </li>
            <li className="flex gap-3">
              <span className="font-bold text-primary">6.</span>
              <span>اختبر زر "كوتاي ماني" لحفظ البيانات</span>
            </li>
          </ol>
        </Card>

        {/* Warning */}
        <Card className="p-6 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            ⚠️ <span className="font-semibold">ملاحظة:</span> هذه البيانات للاختبار فقط. يمكنك حذف الموظفين أو البيانات في أي وقت.
          </p>
        </Card>
      </div>
    </div>
  );
}
