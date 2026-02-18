'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { RackSimulator } from '@/components/rack-sim/rack-simulator';

function EditorPage() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');
  const modelId = searchParams.get('modelId');
  return <RackSimulator orderId={orderId} modelId={modelId} />;
}

export default function NewModelV2Page() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen">로딩 중...</div>}>
      <EditorPage />
    </Suspense>
  );
}
