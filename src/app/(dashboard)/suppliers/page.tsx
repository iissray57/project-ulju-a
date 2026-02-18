import { SupplierList } from '@/components/suppliers/supplier-list';
import { SupplierFormDialog } from '@/components/suppliers/supplier-form-dialog';
import { getSuppliers } from './actions';

interface PageProps {
  searchParams: Promise<{ query?: string; page?: string; isActive?: string }>;
}

export default async function SuppliersPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const query = params.query || '';
  const page = Number(params.page || '1');
  const isActive = params.isActive === 'false' ? false : undefined;
  const limit = 20;
  const offset = (page - 1) * limit;

  const result = await getSuppliers({ query, offset, limit, isActive });

  if (result.error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">거래처 관리</h1>
        </div>
        <div className="text-center py-12 text-destructive">{result.error}</div>
      </div>
    );
  }

  const suppliers = result.data || [];
  const total = result.count || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">거래처 관리</h1>
          <p className="text-muted-foreground mt-2">
            총 {total}개의 거래처가 등록되어 있습니다
          </p>
        </div>
        <SupplierFormDialog />
      </div>

      <SupplierList suppliers={suppliers} total={total} />
    </div>
  );
}
