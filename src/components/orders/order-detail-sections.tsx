import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import type { OrderWithCustomer } from '@/app/(dashboard)/orders/actions';

interface OrderDetailSectionsProps {
  order: OrderWithCustomer;
}

// 금액 포맷
function formatCurrency(amount: number | null) {
  if (amount === null) return '-';
  return new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency: 'KRW',
  }).format(amount);
}

// 날짜 포맷
function formatDate(dateStr: string | null) {
  if (!dateStr) return '미정';
  try {
    return new Date(dateStr).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'short',
    });
  } catch {
    return '미정';
  }
}

// 옷장 유형 라벨
function getClosetTypeLabel(type: string | null) {
  if (!type) return '-';
  switch (type) {
    case 'angle':
      return '앵글형';
    case 'system':
      return '시스템형';
    case 'mixed':
      return '혼합형';
    default:
      return type;
  }
}

export function OrderDetailSections({ order }: OrderDetailSectionsProps) {
  return (
    <div className="space-y-6">
      {/* 정보 카드 그리드 */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* 고객 정보 */}
        <Card>
          <CardHeader>
            <CardTitle>고객 정보</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-sm text-muted-foreground mb-1">고객명</div>
              <div className="font-medium">
                {order.customer ? order.customer.name : '미지정'}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground mb-1">연락처</div>
              <div className="font-medium">
                {order.customer ? order.customer.phone : '미지정'}
              </div>
            </div>
            {order.site_address && (
              <div>
                <div className="text-sm text-muted-foreground mb-1">현장 주소</div>
                <div className="font-medium whitespace-pre-wrap">{order.site_address}</div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 옷장 사양 */}
        <Card>
          <CardHeader>
            <CardTitle>옷장 사양</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-sm text-muted-foreground mb-1">유형</div>
              <div className="font-medium">{getClosetTypeLabel(order.closet_type)}</div>
            </div>
            {order.closet_spec && typeof order.closet_spec === 'object' && (
              <div>
                <div className="text-sm text-muted-foreground mb-1">치수</div>
                <div className="font-medium text-sm space-y-1">
                  {Object.entries(order.closet_spec as Record<string, unknown>).map(
                    ([key, value]) => (
                      <div key={key}>
                        <span className="text-muted-foreground">{key}:</span>{' '}
                        {String(value)}
                      </div>
                    )
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 금액 정보 */}
        <Card>
          <CardHeader>
            <CardTitle>금액 정보</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-sm text-muted-foreground mb-1">견적액</div>
              <div className="font-medium text-lg">
                {formatCurrency(order.quotation_amount)}
              </div>
            </div>
            <Separator />
            <div>
              <div className="text-sm text-muted-foreground mb-1">확정액</div>
              <div className="font-medium text-lg">
                {formatCurrency(order.confirmed_amount)}
              </div>
            </div>
            {order.payment_method && (
              <div>
                <div className="text-sm text-muted-foreground mb-1">결제 방식</div>
                <div className="font-medium">{order.payment_method}</div>
              </div>
            )}
            {order.payment_date && (
              <div>
                <div className="text-sm text-muted-foreground mb-1">결제일</div>
                <div className="font-medium">{formatDate(order.payment_date)}</div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 일정 */}
        <Card>
          <CardHeader>
            <CardTitle>일정</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-sm text-muted-foreground mb-1">실측일</div>
              <div className="font-medium">{formatDate(order.measurement_date)}</div>
            </div>
            <Separator />
            <div>
              <div className="text-sm text-muted-foreground mb-1">설치일</div>
              <div className="font-medium">{formatDate(order.installation_date)}</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 메모 섹션 */}
      <div className="grid gap-6 lg:grid-cols-2">
        {order.site_memo && (
          <Card>
            <CardHeader>
              <CardTitle>현장 메모</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="whitespace-pre-wrap text-sm">{order.site_memo}</div>
            </CardContent>
          </Card>
        )}
        {order.memo && (
          <Card>
            <CardHeader>
              <CardTitle>일반 메모</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="whitespace-pre-wrap text-sm">{order.memo}</div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
