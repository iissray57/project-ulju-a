import { ReportList } from '@/components/reports/report-list';
import { getReports } from './actions';

interface PageProps {
  searchParams: Promise<{ type?: string }>;
}

export default async function ReportsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const type = params.type as 'quotation' | 'checklist' | undefined;

  const result = await getReports({ type });

  if (result.error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">리포트</h1>
        </div>
        <div className="text-center py-12 text-destructive">{result.error}</div>
      </div>
    );
  }

  const reports = result.data || [];
  const total = result.count || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">리포트</h1>
          <p className="text-muted-foreground mt-2">
            총 {total}개의 리포트가 저장되어 있습니다
          </p>
        </div>
      </div>

      <ReportList reports={reports} />
    </div>
  );
}
