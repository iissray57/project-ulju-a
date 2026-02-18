import { notFound } from 'next/navigation';
import { getOrder } from '@/app/(dashboard)/orders/actions';
import { OrderForm } from '@/components/orders/order-form';
import type { OrderFormData } from '@/lib/schemas/order';
import { workSpecSchema, type WorkSpec } from '@/lib/schemas/work-spec';

interface EditOrderPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditOrderPage({ params }: EditOrderPageProps) {
  const { id } = await params;
  const result = await getOrder(id);

  if (result.error || !result.data) {
    notFound();
  }

  // Note: DB 타입 outdated - supabase gen types 재실행 필요
  const order = result.data as unknown as Record<string, unknown>;

  // Validate required fields
  if (!order.customer_id) {
    notFound();
  }

  // Parse work_spec from Json to WorkSpec
  let parsedWorkSpec: WorkSpec | undefined = undefined;
  if (order.work_spec) {
    const parseResult = workSpecSchema.safeParse(order.work_spec);
    if (parseResult.success) {
      parsedWorkSpec = parseResult.data;
    }
  }

  // Convert to OrderFormData
  const workType = order.work_type as string | undefined;
  const defaultValues: OrderFormData = {
    customer_id: order.customer_id as string,
    work_type: workType && ['angle', 'system', 'mixed', 'curtain', 'demolition'].includes(workType)
      ? (workType as 'angle' | 'system' | 'mixed' | 'curtain' | 'demolition')
      : undefined,
    work_spec: parsedWorkSpec,
    quotation_amount: (order.quotation_amount as number) ?? 0,
    confirmed_amount: (order.confirmed_amount as number) ?? 0,
    measurement_date: (order.measurement_date as string) ?? '',
    installation_date: (order.installation_date as string) ?? '',
    site_address: (order.site_address as string) ?? '',
    site_memo: (order.site_memo as string) ?? '',
    memo: (order.memo as string) ?? '',
  };

  return (
    <div className="container max-w-4xl mx-auto py-8">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">주문 수정</h1>
          <p className="text-muted-foreground mt-2">
            주문번호: {order.order_number as string}
          </p>
        </div>
        <OrderForm orderId={id} defaultValues={defaultValues} />
      </div>
    </div>
  );
}
