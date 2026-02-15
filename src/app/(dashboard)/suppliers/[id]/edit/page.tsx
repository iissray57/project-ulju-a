import { redirect } from 'next/navigation';
import { SupplierForm } from '@/components/suppliers/supplier-form';
import { getSupplier } from '../../actions';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditSupplierPage({ params }: PageProps) {
  const { id } = await params;
  const result = await getSupplier(id);

  if (result.error || !result.data) {
    redirect('/suppliers');
  }

  const supplier = result.data;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">거래처 수정</h1>
        <p className="text-muted-foreground mt-2">{supplier.name} 정보를 수정합니다</p>
      </div>

      <div className="max-w-2xl">
        <SupplierForm
          supplierId={id}
          defaultValues={{
            name: supplier.name,
            phone: supplier.phone || '',
            address: supplier.address || '',
            business_number: supplier.business_number || '',
            contact_person: supplier.contact_person || '',
            memo: supplier.memo || '',
            is_active: supplier.is_active ?? true,
          }}
        />
      </div>
    </div>
  );
}
