import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getCustomerWithOrders } from '../actions';
import { DeleteCustomerButton } from '@/components/customers/delete-customer-button';
import { CustomerFormDialog } from '@/components/customers/customer-form-dialog';
import { ScheduleFormDialog } from '@/components/schedule/schedule-form-dialog';
import {
  ORDER_STATUS_LABELS,
  ORDER_STATUS_COLORS,
  type OrderStatus,
} from '@/lib/schemas/order-status';
import { WORK_TYPE_LABELS, type WorkType } from '@/lib/schemas/order';

interface PageProps {
  params: Promise<{ id: string }>;
}

function formatAmount(amount: number | null): string {
  if (amount == null) return '-';
  return amount.toLocaleString('ko-KR') + '원';
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('ko-KR');
}

export default async function CustomerDetailPage({ params }: PageProps) {
  const { id } = await params;
  const result = await getCustomerWithOrders(id);

  if (result.error || !result.data) {
    redirect('/customers');
  }

  const customer = result.data;
  const orders = customer.orders || [];

  // 통계 계산 (취소 제외)
  const activeOrders = orders.filter((o) => o.status !== 'cancelled');
  const totalOrders = activeOrders.length;
  const totalRevenue = activeOrders.reduce(
    (sum, o) => sum + (o.confirmed_amount || o.quotation_amount || 0),
    0
  );

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

        {/* 주문 통계 */}
        <Card>
          <CardHeader>
            <CardTitle>주문 통계</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-sm text-muted-foreground mb-1">총 주문 건수</div>
              <div className="text-2xl font-bold">{totalOrders}건</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground mb-1">총 매출</div>
              <div className="text-2xl font-bold">{formatAmount(totalRevenue)}</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 주문 목록 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>주문 목록</CardTitle>
          <Button size="sm" asChild>
            <Link href={`/orders/new?customer_id=${id}`}>주문 추가</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {orders.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              등록된 주문이 없습니다
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="pb-2 font-medium">주문번호</th>
                    <th className="pb-2 font-medium">상태</th>
                    <th className="pb-2 font-medium">작업유형</th>
                    <th className="pb-2 font-medium text-right">금액</th>
                    <th className="pb-2 font-medium">실측일</th>
                    <th className="pb-2 font-medium">설치일</th>
                    <th className="pb-2 font-medium">등록일</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id} className="border-b last:border-0 hover:bg-muted/50">
                      <td className="py-3">
                        <Link
                          href={`/orders/${order.id}`}
                          className="text-primary hover:underline font-medium"
                        >
                          {order.order_number}
                        </Link>
                      </td>
                      <td className="py-3">
                        {order.status && (
                          <Badge
                            variant="secondary"
                            className={ORDER_STATUS_COLORS[order.status as OrderStatus] || ''}
                          >
                            {ORDER_STATUS_LABELS[order.status as OrderStatus] || order.status}
                          </Badge>
                        )}
                      </td>
                      <td className="py-3">
                        {order.work_type
                          ? WORK_TYPE_LABELS[order.work_type as WorkType] || order.work_type
                          : '-'}
                      </td>
                      <td className="py-3 text-right">
                        {formatAmount(order.confirmed_amount || order.quotation_amount)}
                      </td>
                      <td className="py-3">{formatDate(order.measurement_date)}</td>
                      <td className="py-3">{formatDate(order.installation_date)}</td>
                      <td className="py-3">{formatDate(order.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
