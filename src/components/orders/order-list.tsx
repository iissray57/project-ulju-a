'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  ORDER_STATUS_LABELS,
  ORDER_STATUS_COLORS,
  type OrderStatus,
} from '@/lib/schemas/order-status';
import type { OrderWithCustomer } from '@/app/(dashboard)/orders/actions';

interface OrderListProps {
  orders: OrderWithCustomer[];
  total: number;
}

const STATUS_FILTERS: { label: string; value: OrderStatus | 'all' }[] = [
  { label: '전체', value: 'all' },
  { label: '의뢰', value: 'inquiry' },
  { label: '견적발송', value: 'quotation_sent' },
  { label: '확정', value: 'confirmed' },
  { label: '진행중', value: 'date_fixed' },
  { label: '완료', value: 'installed' },
  { label: '취소', value: 'cancelled' },
];

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency: 'KRW',
  }).format(amount);
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

export function OrderList({ orders, total }: OrderListProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [query, setQuery] = useState(searchParams.get('q') || '');
  const currentStatus = (searchParams.get('status') as OrderStatus) || 'all';
  const page = Number(searchParams.get('page') || '1');
  const limit = 20;

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (query) {
        params.set('q', query);
        params.set('page', '1'); // Reset to first page on search
      } else {
        params.delete('q');
      }
      router.push(`/orders?${params.toString()}`);
    }, 300);

    return () => clearTimeout(timer);
  }, [query, searchParams, router]);

  const handleStatusFilter = (status: OrderStatus | 'all') => {
    const params = new URLSearchParams(searchParams.toString());
    if (status === 'all') {
      params.delete('status');
    } else {
      params.set('status', status);
    }
    params.set('page', '1'); // Reset to first page
    router.push(`/orders?${params.toString()}`);
  };

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', newPage.toString());
    router.push(`/orders?${params.toString()}`);
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-4">
      {/* Status Filter Chips */}
      <div className="flex flex-wrap gap-2">
        {STATUS_FILTERS.map((filter) => (
          <Button
            key={filter.value}
            variant={currentStatus === filter.value ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleStatusFilter(filter.value)}
          >
            {filter.label}
          </Button>
        ))}
      </div>

      {/* Search Input */}
      <div className="flex gap-3">
        <Input
          placeholder="수주번호, 고객명으로 검색..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="max-w-md"
        />
      </div>

      {/* Mobile Card List */}
      <div className="block md:hidden space-y-3">
        {orders.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center space-y-4">
              <p className="text-muted-foreground">등록된 수주가 없습니다</p>
              <Button asChild>
                <Link href="/orders/new">수주 등록</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          orders.map((order) => (
            <Card
              key={order.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => router.push(`/orders/${order.id}`)}
            >
              <CardContent className="space-y-2 p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-semibold text-sm text-muted-foreground">
                      {order.order_number}
                    </div>
                    <div className="font-bold text-lg">
                      {order.customer?.name || '고객 정보 없음'}
                    </div>
                  </div>
                  {order.status && (
                    <Badge className={ORDER_STATUS_COLORS[order.status]}>
                      {ORDER_STATUS_LABELS[order.status]}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    {order.closet_type || '유형 미정'}
                  </span>
                  {order.confirmed_amount ? (
                    <span className="font-semibold">
                      {formatCurrency(order.confirmed_amount)}
                    </span>
                  ) : order.quotation_amount ? (
                    <span className="text-muted-foreground">
                      견적: {formatCurrency(order.quotation_amount)}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">금액 미정</span>
                  )}
                </div>
                {order.created_at && (
                  <div className="text-xs text-muted-foreground">
                    {formatDate(order.created_at)}
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>수주번호</TableHead>
              <TableHead>고객명</TableHead>
              <TableHead>유형</TableHead>
              <TableHead className="text-right">견적액</TableHead>
              <TableHead className="text-right">확정액</TableHead>
              <TableHead>상태</TableHead>
              <TableHead>등록일</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12">
                  <div className="space-y-4">
                    <p className="text-muted-foreground">등록된 수주가 없습니다</p>
                    <Button asChild>
                      <Link href="/orders/new">수주 등록</Link>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              orders.map((order) => (
                <TableRow
                  key={order.id}
                  className="cursor-pointer hover:bg-accent"
                  onClick={() => router.push(`/orders/${order.id}`)}
                >
                  <TableCell className="font-medium">{order.order_number}</TableCell>
                  <TableCell>{order.customer?.name || '고객 정보 없음'}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {order.closet_type || '-'}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {order.quotation_amount ? formatCurrency(order.quotation_amount) : '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    {order.confirmed_amount ? formatCurrency(order.confirmed_amount) : '-'}
                  </TableCell>
                  <TableCell>
                    {order.status ? (
                      <Badge className={ORDER_STATUS_COLORS[order.status]}>
                        {ORDER_STATUS_LABELS[order.status]}
                      </Badge>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {order.created_at ? formatDate(order.created_at) : '-'}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(page - 1)}
            disabled={page === 1}
          >
            이전
          </Button>
          <div className="flex items-center gap-2 px-3">
            <span className="text-sm text-muted-foreground">
              {page} / {totalPages}
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(page + 1)}
            disabled={page === totalPages}
          >
            다음
          </Button>
        </div>
      )}

      {/* Mobile FAB */}
      <Link
        href="/orders/new"
        className="md:hidden fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-colors"
        aria-label="수주 등록"
      >
        <Plus className="h-6 w-6" />
      </Link>
    </div>
  );
}
