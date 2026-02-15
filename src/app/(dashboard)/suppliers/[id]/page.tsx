import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getSupplier } from '../actions';
import { DeleteSupplierButton } from '@/components/suppliers/delete-supplier-button';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function SupplierDetailPage({ params }: PageProps) {
  const { id } = await params;
  const result = await getSupplier(id);

  if (result.error || !result.data) {
    redirect('/suppliers');
  }

  const supplier = result.data;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{supplier.name}</h1>
          <p className="text-muted-foreground mt-2">거래처 상세 정보</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" asChild>
            <Link href="/suppliers">목록으로</Link>
          </Button>
          <Button asChild>
            <Link href={`/suppliers/${id}/edit`}>수정</Link>
          </Button>
          <DeleteSupplierButton supplierId={id} supplierName={supplier.name} />
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
              <div className="text-sm text-muted-foreground mb-1">거래처명</div>
              <div className="font-medium">{supplier.name}</div>
            </div>
            {supplier.phone && (
              <div>
                <div className="text-sm text-muted-foreground mb-1">연락처</div>
                <div className="font-medium">{supplier.phone}</div>
              </div>
            )}
            {supplier.contact_person && (
              <div>
                <div className="text-sm text-muted-foreground mb-1">담당자</div>
                <div className="font-medium">{supplier.contact_person}</div>
              </div>
            )}
            {supplier.business_number && (
              <div>
                <div className="text-sm text-muted-foreground mb-1">사업자번호</div>
                <div className="font-medium">{supplier.business_number}</div>
              </div>
            )}
            {supplier.address && (
              <div>
                <div className="text-sm text-muted-foreground mb-1">주소</div>
                <div className="font-medium">{supplier.address}</div>
              </div>
            )}
            {supplier.memo && (
              <div>
                <div className="text-sm text-muted-foreground mb-1">메모</div>
                <div className="font-medium whitespace-pre-wrap">{supplier.memo}</div>
              </div>
            )}
            <div>
              <div className="text-sm text-muted-foreground mb-1">상태</div>
              <div className="font-medium">
                {supplier.is_active === false ? (
                  <span className="text-destructive">비활성</span>
                ) : (
                  <span className="text-green-600">활성</span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 발주 통계 (placeholder) */}
        <Card>
          <CardHeader>
            <CardTitle>발주 통계</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-sm text-muted-foreground mb-1">총 발주 건수</div>
              <div className="text-2xl font-bold">-</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground mb-1">총 발주 금액</div>
              <div className="text-2xl font-bold">-</div>
            </div>
            <div className="text-sm text-muted-foreground pt-2">
              * 발주 관리 기능 구현 후 표시됩니다
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 발주 목록 (placeholder) */}
      <Card>
        <CardHeader>
          <CardTitle>발주 목록</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            발주 관리 기능이 구현되면 여기에 발주 목록이 표시됩니다
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
