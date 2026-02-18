import { Suspense } from 'react';
import { getQuoteRequests, type QuoteRequestStatus } from './actions';
import { QuoteRequestsList } from '@/components/quote-requests/quote-requests-list';
import { QuoteRequestsFilters } from '@/components/quote-requests/quote-requests-filters';

interface PageProps {
  searchParams: Promise<{ status?: string; q?: string; page?: string }>;
}

export default async function QuoteRequestsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const status = params.status as QuoteRequestStatus | undefined;
  const search = params.q || '';
  const page = Number(params.page || '1');

  const result = await getQuoteRequests({ status, search, page, limit: 50 });

  if (result.error) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">견적요청 관리</h1>
        <div className="text-center py-12 text-destructive">{result.error}</div>
      </div>
    );
  }

  const items = result.data || [];
  const total = result.count || 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">견적요청 관리</h1>
        <p className="text-muted-foreground mt-1">랜딩 페이지를 통해 접수된 견적 요청을 관리합니다.</p>
      </div>

      <Suspense fallback={null}>
        <QuoteRequestsFilters
          currentStatus={status || ''}
          currentSearch={search}
        />
      </Suspense>

      <QuoteRequestsList initialData={items} total={total} />
    </div>
  );
}
