import { notFound } from 'next/navigation';
import { getOrder } from '@/app/(dashboard)/orders/actions';
import { OrderForm } from '@/components/orders/order-form';
import type { OrderFormData } from '@/lib/schemas/order';
import { closetSpecSchema, type ClosetSpec } from '@/lib/schemas/closet-spec';

interface EditOrderPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditOrderPage({ params }: EditOrderPageProps) {
  const { id } = await params;
  const result = await getOrder(id);

  if (result.error || !result.data) {
    notFound();
  }

  const order = result.data;

  // Validate required fields
  if (!order.customer_id) {
    notFound();
  }

  // Parse closet_spec from Json to ClosetSpec
  let parsedClosetSpec: ClosetSpec | undefined = undefined;
  if (order.closet_spec) {
    const parseResult = closetSpecSchema.safeParse(order.closet_spec);
    if (parseResult.success) {
      parsedClosetSpec = parseResult.data;
    }
  }

  // Convert OrderWithCustomer to OrderFormData
  const defaultValues: OrderFormData = {
    customer_id: order.customer_id as string, // validated above
    closet_type: order.closet_type && ['angle', 'system', 'mixed'].includes(order.closet_type)
      ? (order.closet_type as 'angle' | 'system' | 'mixed')
      : undefined,
    closet_spec: parsedClosetSpec,
    quotation_amount: order.quotation_amount ?? 0,
    confirmed_amount: order.confirmed_amount ?? 0,
    measurement_date: order.measurement_date ?? '',
    installation_date: order.installation_date ?? '',
    site_address: order.site_address ?? '',
    site_memo: order.site_memo ?? '',
    memo: order.memo ?? '',
  };

  return (
    <div className="container max-w-4xl mx-auto py-8">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">주문 수정</h1>
          <p className="text-muted-foreground mt-2">
            주문번호: {order.order_number}
          </p>
        </div>
        <OrderForm orderId={id} defaultValues={defaultValues} />
      </div>
    </div>
  );
}
