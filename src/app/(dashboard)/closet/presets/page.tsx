import { Suspense } from 'react';
import { getPresets } from '@/app/(dashboard)/closet/actions';
import { PresetsList } from './presets-list';

interface PresetsPageProps {
  searchParams?: Promise<{ category?: string }>;
}

export default async function PresetsPage({
  searchParams,
}: PresetsPageProps) {
  const params = searchParams ? await searchParams : undefined;
  const category = params?.category;
  const result = await getPresets(category);

  if (result.error) {
    return (
      <div className="p-6">
        <div className="rounded-md border border-destructive bg-destructive/10 p-4">
          <p className="text-sm text-destructive">{result.error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">프리셋 관리</h1>
          <p className="text-muted-foreground">
            옷장 컴포넌트 프리셋을 관리합니다.
          </p>
        </div>
      </div>

      <Suspense fallback={<div>로딩 중...</div>}>
        <PresetsList presets={result.data || []} initialCategory={category} />
      </Suspense>
    </div>
  );
}
