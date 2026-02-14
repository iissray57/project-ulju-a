import { redirect, notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getPurchaseOrder } from '../../actions';
import { PurchaseOrderForm } from '@/components/purchases/purchase-order-form';
import type { PurchaseOrderFormData } from '@/lib/schemas/purchase-order';

interface EditPurchasePageProps {
  params: Promise<{ id: string }>;
}

export default async function EditPurchasePage({ params }: EditPurchasePageProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { id } = await params;
  const result = await getPurchaseOrder(id);

  if (result.error || !result.data) {
    notFound();
  }

  const po = result.data;

  const defaultValues: PurchaseOrderFormData = {
    supplier_name: po.supplier_name ?? undefined,
    supplier_phone: po.supplier_phone ?? undefined,
    total_amount: po.total_amount ?? 0,
    payment_date: po.payment_date ?? undefined,
    memo: po.memo ?? undefined,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">발주 수정</h1>
        <p className="text-muted-foreground mt-2">{po.po_number}</p>
      </div>

      <PurchaseOrderForm poId={id} defaultValues={defaultValues} />
    </div>
  );
}
