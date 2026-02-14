import { QuickActionBar } from '@/components/dashboard/quick-action-bar';
import { TodayScheduleCard } from '@/components/dashboard/today-schedule-card';
import { OrderPipelineSummary } from '@/components/dashboard/order-pipeline-summary';
import { InventoryAlertList } from '@/components/dashboard/inventory-alert-list';

export const dynamic = 'force-dynamic';

export default function DashboardPage() {
  return (
    <div className="p-4 lg:p-6">
      <h1 className="text-2xl font-bold">대시보드</h1>
      <p className="mt-2 text-muted-foreground mb-6">
        ClosetBiz 업무 관리 시스템
      </p>

      {/* 그리드 레이아웃: 모바일 1열, 데스크톱 2열 */}
      <div className="space-y-6">
        {/* 빠른 액션 바 (상단 full width) */}
        <QuickActionBar />

        {/* 2열 그리드 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <TodayScheduleCard />
          <OrderPipelineSummary />
        </div>

        {/* 재고 경고 (full width) */}
        <InventoryAlertList />
      </div>
    </div>
  );
}
