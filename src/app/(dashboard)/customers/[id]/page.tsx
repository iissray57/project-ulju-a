import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getCustomer } from '../actions';
import { DeleteCustomerButton } from '@/components/customers/delete-customer-button';
import { CustomerFormDialog } from '@/components/customers/customer-form-dialog';
import { ScheduleFormDialog } from '@/components/schedule/schedule-form-dialog';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function CustomerDetailPage({ params }: PageProps) {
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
          <h1 className="text-3xl font-bold">{customer.name}</h1>
          <p className="text-muted-foreground mt-2">고객 상세 정보</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" asChild>
            <Link href="/customers">목록으로</Link>
          </Button>
          <ScheduleFormDialog />
          <CustomerFormDialog
            customerId={id}
            defaultValues={{
              name: customer.name,
              phone: customer.phone,
              address: customer.address || '',
              address_detail: customer.address_detail || '',
              memo: customer.memo || '',
            }}
            trigger={<Button variant="outline">수정</Button>}
          />
          <DeleteCustomerButton customerId={id} customerName={customer.name} />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* 기본 정보 */}
        <Card>
          <CardHeader>
            <CardTitle>기본 정보</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-sm text-muted-foreground mb-1">고객명</div>
              <div className="font-medium">{customer.name}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground mb-1">연락처</div>
              <div className="font-medium">{customer.phone}</div>
            </div>
            {customer.address && (
              <div>
                <div className="text-sm text-muted-foreground mb-1">주소</div>
                <div className="font-medium">
                  {customer.address}
                  {customer.address_detail && (
                    <>
                      <br />
                      {customer.address_detail}
                    </>
                  )}
                </div>
              </div>
            )}
            {customer.memo && (
              <div>
                <div className="text-sm text-muted-foreground mb-1">메모</div>
                <div className="font-medium whitespace-pre-wrap">{customer.memo}</div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 통계 정보 (placeholder) */}
        <Card>
          <CardHeader>
            <CardTitle>주문 통계</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-sm text-muted-foreground mb-1">총 주문 건수</div>
              <div className="text-2xl font-bold">-</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground mb-1">총 매출</div>
              <div className="text-2xl font-bold">-</div>
            </div>
            <div className="text-sm text-muted-foreground pt-2">
              * 주문 관리 기능 구현 후 표시됩니다
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 주문 목록 (placeholder) */}
      <Card>
        <CardHeader>
          <CardTitle>주문 목록</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            주문 관리 기능이 구현되면 여기에 주문 목록이 표시됩니다
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
