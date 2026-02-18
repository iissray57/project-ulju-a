import { MonthlyRevenueChart } from '@/components/reports/monthly-revenue-chart';
import { OrderStatusPie } from '@/components/reports/order-status-pie';
import { QuarterlyComparison } from '@/components/reports/quarterly-comparison';
import { CustomerRanking } from '@/components/reports/customer-ranking';
import {
  getMonthlyRevenue,
  getOrderStatusDistribution,
  getQuarterlyComparison,
  getTopCustomers,
} from '../actions';

export const dynamic = 'force-dynamic';

export default async function StatisticsPage() {
  const currentYear = new Date().getFullYear();

  const [monthlyResult, statusResult, quarterlyResult, customersResult] =
    await Promise.all([
      getMonthlyRevenue(currentYear),
      getOrderStatusDistribution(),
      getQuarterlyComparison(currentYear),
      getTopCustomers(10),
    ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">통계 대시보드</h1>
        <p className="text-muted-foreground mt-2">
          {currentYear}년 비즈니스 현황을 확인하세요
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="col-span-2">
          <MonthlyRevenueChart
            data={monthlyResult.data || []}
            year={currentYear}
          />
        </div>

        <OrderStatusPie data={statusResult.data || []} />

        <QuarterlyComparison data={quarterlyResult.data || []} />

        <div className="col-span-2">
          <CustomerRanking data={customersResult.data || []} />
        </div>
      </div>
    </div>
  );
}
