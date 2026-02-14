import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Plus, Search } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { getPurchaseOrders } from './actions';
import { PurchasesViewContainer } from '@/components/purchases/purchases-view-container';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PO_STATUS, PO_STATUS_LABELS, type PoStatus } from '@/lib/schemas/purchase-order';

interface PurchasesPageProps {
  searchParams: Promise<{
    status?: string;
    search?: string;
  }>;
}

async function PurchasesContent({ searchParams }: PurchasesPageProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const params = await searchParams;
  const status = params.status as PoStatus | undefined;
  const search = params.search;

  const result = await getPurchaseOrders({
    status,
    search,
    page: 1,
    limit: 100,
  });

  const orders = result.data || [];
  const total = result.count || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">발주 관리</h1>
        <Button asChild className="hidden md:flex">
          <Link href="/purchases/new">
            <Plus className="mr-2 h-4 w-4" />
            발주 등록
          </Link>
        </Button>
      </div>

      {/* Status Tabs */}
      <Tabs defaultValue={status || 'all'} className="w-full">
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="all" asChild>
            <Link href="/purchases">전체</Link>
          </TabsTrigger>
          {PO_STATUS.map((s) => (
            <TabsTrigger key={s} value={s} asChild>
              <Link href={`/purchases?status=${s}`}>{PO_STATUS_LABELS[s]}</Link>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Search */}
      <form action="/purchases" method="get" className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          name="search"
          type="search"
          placeholder="발주번호 또는 거래처명으로 검색..."
          defaultValue={search}
          className="pl-9"
        />
        {status && <input type="hidden" name="status" value={status} />}
      </form>

      {/* View Container */}
      <PurchasesViewContainer orders={orders} total={total} />
    </div>
  );
}

export default function PurchasesPage(props: PurchasesPageProps) {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-20">
          <div className="text-muted-foreground">로딩 중...</div>
        </div>
      }
    >
      <PurchasesContent {...props} />
    </Suspense>
  );
}
