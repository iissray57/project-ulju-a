import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import {
  getRevenueRecords,
  getCostRecords,
  getMonthlyRevenueSummary,
  getMonthlyCostSummary,
  getRevenueSummary,
  getCostSummary,
} from './actions';
import { FinanceViewContainer } from '@/components/finance/finance-view-container';

interface FinancePageProps {
  searchParams: Promise<{
    year?: string;
    month?: string;
  }>;
}

export default async function FinancePage({ searchParams }: FinancePageProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const params = await searchParams;
  const now = new Date();
  const year = params.year ? parseInt(params.year, 10) : now.getFullYear();
  const month = params.month ? parseInt(params.month, 10) : now.getMonth() + 1;

  // 해당 월의 시작일과 종료일 계산
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

  // 매출/매입 데이터 조회
  const [revenueResult, costResult, revenueSummaryResult, costSummaryResult, recentRevenueResult, recentCostResult] =
    await Promise.all([
      getMonthlyRevenueSummary(year, month),
      getMonthlyCostSummary(year, month),
      getRevenueSummary('monthly', year),
      getCostSummary('monthly', year),
      getRevenueRecords({ startDate, endDate, limit: 100 }),
      getCostRecords({ startDate, endDate, limit: 100 }),
    ]);

  const revenueSummary = revenueResult.data?.total_amount ?? 0;
  const costSummary = costResult.data?.total_amount ?? 0;
  const profit = revenueSummary - costSummary;
  const profitMargin = revenueSummary > 0 ? (profit / revenueSummary) * 100 : 0;

  const monthlyRevenueTrend = revenueSummaryResult.data ?? [];
  const monthlyCostTrend = costSummaryResult.data ?? [];

  const revenueRecords = recentRevenueResult.data ?? [];
  const costRecords = recentCostResult.data ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">매출/매입</h1>
        <p className="text-muted-foreground mt-1">매출과 매입을 관리하고 손익을 확인합니다.</p>
      </div>

      <FinanceViewContainer
        year={year}
        month={month}
        revenueSummary={revenueSummary}
        costSummary={costSummary}
        profit={profit}
        profitMargin={profitMargin}
        monthlyRevenueTrend={monthlyRevenueTrend}
        monthlyCostTrend={monthlyCostTrend}
        revenueRecords={revenueRecords}
        costRecords={costRecords}
      />
    </div>
  );
}
