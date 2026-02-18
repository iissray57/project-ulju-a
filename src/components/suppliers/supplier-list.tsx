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
import { ExportButton } from '@/components/ui/export-button';
import type { ExportColumn } from '@/lib/utils/export';
import type { Database } from '@/lib/database.types';
import { formatPhone } from '@/lib/utils';

type Supplier = Database['public']['Tables']['suppliers']['Row'];

interface SupplierListProps {
  suppliers: Supplier[];
  total: number;
}

const SUPPLIER_EXPORT_COLUMNS: ExportColumn<Supplier>[] = [
  { header: '거래처명', accessor: (r) => r.name },
  { header: '연락처', accessor: (r) => formatPhone(r.phone) },
  { header: '담당자', accessor: (r) => r.contact_person },
  { header: '사업자번호', accessor: (r) => r.business_number },
  { header: '상태', accessor: (r) => r.is_active === false ? '비활성' : '활성' },
];

export function SupplierList({ suppliers, total }: SupplierListProps) {
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
      router.push(`/suppliers?${params.toString()}`);
    }, 300);

    return () => clearTimeout(timer);
  }, [query, searchParams, router]);

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', newPage.toString());
    router.push(`/suppliers?${params.toString()}`);
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="flex gap-3">
        <Input
          placeholder="거래처명, 연락처, 담당자로 검색..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="max-w-md"
        />
        <ExportButton data={suppliers} columns={SUPPLIER_EXPORT_COLUMNS} filename="거래처목록" sheetName="거래처" />
      </div>

      {/* Mobile Card List */}
      <div className="block md:hidden space-y-3">
        {suppliers.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              등록된 거래처가 없습니다
            </CardContent>
          </Card>
        ) : (
          suppliers.map((supplier) => (
            <Card
              key={supplier.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => router.push(`/suppliers/${supplier.id}`)}
            >
              <CardContent className="space-y-2">
                <div className="font-semibold text-lg">{supplier.name}</div>
                {supplier.phone && (
                  <div className="text-sm text-muted-foreground">{formatPhone(supplier.phone)}</div>
                )}
                {supplier.contact_person && (
                  <div className="text-sm text-muted-foreground">
                    담당: {supplier.contact_person}
                  </div>
                )}
                {supplier.is_active === false && (
                  <div className="text-xs text-destructive">비활성</div>
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
              <TableHead>거래처명</TableHead>
              <TableHead>연락처</TableHead>
              <TableHead>담당자</TableHead>
              <TableHead>사업자번호</TableHead>
              <TableHead className="text-center">상태</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {suppliers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  등록된 거래처가 없습니다
                </TableCell>
              </TableRow>
            ) : (
              suppliers.map((supplier) => (
                <TableRow
                  key={supplier.id}
                  className="cursor-pointer hover:bg-accent"
                  onClick={() => router.push(`/suppliers/${supplier.id}`)}
                >
                  <TableCell className="font-medium">{supplier.name}</TableCell>
                  <TableCell>{formatPhone(supplier.phone) || '-'}</TableCell>
                  <TableCell>{supplier.contact_person || '-'}</TableCell>
                  <TableCell>{supplier.business_number || '-'}</TableCell>
                  <TableCell className="text-center">
                    {supplier.is_active === false ? (
                      <span className="text-destructive text-sm">비활성</span>
                    ) : (
                      <span className="text-green-600 text-sm">활성</span>
                    )}
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
    </div>
  );
}
