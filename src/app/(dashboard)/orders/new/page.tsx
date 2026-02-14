import { OrderForm } from '@/components/orders/order-form';

export default function NewOrderPage() {
  return (
    <div className="container max-w-4xl mx-auto py-8">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">신규 수주 등록</h1>
          <p className="text-muted-foreground mt-2">새로운 수주를 등록합니다.</p>
        </div>
        <OrderForm />
      </div>
    </div>
  );
}
