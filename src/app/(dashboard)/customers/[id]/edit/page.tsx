import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CustomerForm } from '@/components/customers/customer-form';
import { getCustomer } from '../../actions';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditCustomerPage({ params }: PageProps) {
  const { id } = await params;
  const result = await getCustomer(id);

  if (result.error || !result.data) {
    redirect('/customers');
  }

  const customer = result.data;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">고객 정보 수정</h1>
          <p className="text-muted-foreground mt-2">{customer.name}</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" asChild>
            <Link href={`/customers/${id}`}>취소</Link>
          </Button>
        </div>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>고객 정보</CardTitle>
        </CardHeader>
        <CardContent>
          <CustomerForm
            customerId={id}
            defaultValues={{
              name: customer.name,
              phone: customer.phone,
              address: customer.address || '',
              address_detail: customer.address_detail || '',
              memo: customer.memo || '',
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
