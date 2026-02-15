import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { ClosetEditorDynamic } from '@/components/closet/closet-editor-dynamic';

export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams: Promise<{ orderId?: string; modelId?: string }>;
}

export default async function ClosetEditorPage({ searchParams }: PageProps) {
  const { orderId, modelId } = await searchParams;

  return (
    <div className="flex h-[calc(100dvh-3.5rem)] flex-col lg:h-dvh">
      <div className="flex items-center gap-3 border-b border-border bg-background px-4 py-2">
        <Link
          href={orderId ? `/orders/${orderId}` : '/'}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="size-4" />
          <span>뒤로</span>
        </Link>
        <h1 className="text-sm font-semibold">2D 디자이너</h1>
      </div>
      <div className="flex-1 min-h-0">
        <ClosetEditorDynamic orderId={orderId} modelId={modelId} />
      </div>
    </div>
  );
}
