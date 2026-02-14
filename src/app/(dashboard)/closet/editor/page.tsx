import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { ClosetEditorDynamic } from '@/components/closet/closet-editor-dynamic';
import { getPresets } from '@/app/(dashboard)/closet/actions';

export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams: Promise<{ orderId?: string }>;
}

export default async function ClosetEditorPage({ searchParams }: PageProps) {
  const { orderId } = await searchParams;

  // 사용자 프리셋 로딩 (에러 시 빈 배열 사용)
  const result = await getPresets();
  const userPresets = result.data || [];

  return (
    <div className="flex h-[calc(100dvh-3.5rem)] flex-col lg:h-dvh">
      {/* Header bar */}
      <div className="flex items-center gap-3 border-b border-border bg-background px-4 py-2">
        <Link
          href="/"
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="size-4" />
          <span>뒤로</span>
        </Link>
        <h1 className="text-sm font-semibold">3D 옷장 에디터</h1>
      </div>

      {/* Editor */}
      <div className="flex-1 min-h-0">
        <ClosetEditorDynamic userPresets={userPresets} orderId={orderId} />
      </div>
    </div>
  );
}
