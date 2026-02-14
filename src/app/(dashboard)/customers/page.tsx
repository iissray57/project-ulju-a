import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { CustomerList } from '@/components/customers/customer-list';
import { getCustomers } from './actions';

interface PageProps {
  searchParams: Promise<{ query?: string; page?: string }>;
}

export default async function CustomersPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const query = params.query || '';
  const page = Number(params.page || '1');
  const limit = 20;
  const offset = (page - 1) * limit;

  const result = await getCustomers({ query, offset, limit });

  if (result.error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">고객 관리</h1>
        </div>
        <div className="text-center py-12 text-destructive">{result.error}</div>
      </div>
    );
  }

  const customers = result.data || [];
  const total = result.count || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">고객 관리</h1>
          <p className="text-muted-foreground mt-2">
            총 {total}명의 고객이 등록되어 있습니다
          </p>
        </div>
        <Button asChild>
          <Link href="/customers/new">신규 고객 등록</Link>
        </Button>
      </div>

      <CustomerList customers={customers} total={total} />
    </div>
  );
}
