'use client';

import dynamic from 'next/dynamic';

interface ClosetEditorDynamicProps {
  orderId?: string;
}

const ClosetEditorLazy = dynamic(
  () => import('./closet-editor').then((mod) => ({ default: mod.ClosetEditor })),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center bg-muted/30">
        <div className="flex flex-col items-center gap-3">
          <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">2D 디자이너 로딩 중...</p>
        </div>
      </div>
    ),
  }
);

export function ClosetEditorDynamic({ orderId }: ClosetEditorDynamicProps) {
  return <ClosetEditorLazy orderId={orderId} />;
}
