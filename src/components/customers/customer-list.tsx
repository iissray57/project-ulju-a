'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { Database } from '@/lib/database.types';

type Customer = Database['public']['Tables']['customers']['Row'];

interface CustomerListProps {
  customers: Customer[];
  total: number;
}

export function CustomerList({ customers, total }: CustomerListProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [query, setQuery] = useState(searchParams.get('query') || '');
  const page = Number(searchParams.get('page') || '1');
  const limit = 20;

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (query) {
        params.set('query', query);
        params.set('page', '1'); // Reset to first page on search
      } else {
        params.delete('query');
      }
      router.push(`/customers?${params.toString()}`);
    }, 300);

    return () => clearTimeout(timer);
  }, [query, searchParams, router]);

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', newPage.toString());
    router.push(`/customers?${params.toString()}`);
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="flex gap-3">
        <Input
          placeholder="고객명, 연락처, 주소로 검색..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="max-w-md"
        />
      </div>

      {/* Mobile Card List */}
      <div className="block md:hidden space-y-3">
        {customers.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              등록된 고객이 없습니다
            </CardContent>
          </Card>
        ) : (
          customers.map((customer) => (
            <Card
              key={customer.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => router.push(`/customers/${customer.id}`)}
            >
              <CardContent className="space-y-2">
                <div className="font-semibold text-lg">{customer.name}</div>
                <div className="text-sm text-muted-foreground">{customer.phone}</div>
                {customer.address && (
                  <div className="text-sm text-muted-foreground">
                    {customer.address}
                    {customer.address_detail && ` ${customer.address_detail}`}
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
              <TableHead>고객명</TableHead>
              <TableHead>연락처</TableHead>
              <TableHead>주소</TableHead>
              <TableHead className="text-right">수주건수</TableHead>
              <TableHead className="text-right">매출</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {customers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  등록된 고객이 없습니다
                </TableCell>
              </TableRow>
            ) : (
              customers.map((customer) => (
                <TableRow
                  key={customer.id}
                  className="cursor-pointer hover:bg-accent"
                  onClick={() => router.push(`/customers/${customer.id}`)}
                >
                  <TableCell className="font-medium">{customer.name}</TableCell>
                  <TableCell>{customer.phone}</TableCell>
                  <TableCell>
                    {customer.address}
                    {customer.address_detail && ` ${customer.address_detail}`}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">-</TableCell>
                  <TableCell className="text-right text-muted-foreground">-</TableCell>
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
    </div>
  );
}
