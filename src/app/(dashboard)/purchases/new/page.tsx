import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { PurchaseOrderForm } from '@/components/purchases/purchase-order-form';

export default async function NewPurchasePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">발주 등록</h1>
        <p className="text-muted-foreground mt-2">새로운 발주를 등록합니다.</p>
      </div>

      <PurchaseOrderForm />
    </div>
  );
}
