'use client';

import { AngleProvider, useAngleModeler } from './angle-context';
import { AnglePreview } from './angle-preview';
import { AngleSettings } from './angle-settings';
import { AngleMaterialList } from './angle-material-list';
import { Button } from '@/components/ui/button';
import { RotateCcw } from 'lucide-react';

function ModelerContent() {
  const { dispatch } = useAngleModeler();

  return (
    <div className="-m-4 md:-m-6 -mb-20 lg:-mb-6 flex flex-col" style={{ height: 'calc(100dvh - 3.5rem)' }}>
      {/* 툴바 */}
      <div className="flex items-center justify-between border-b bg-white px-4 py-2">
        <h1 className="text-lg font-bold">앵글 모델러</h1>
        <Button variant="outline" size="sm" onClick={() => dispatch({ type: 'RESET' })}>
          <RotateCcw className="mr-1 h-4 w-4" />
          초기화
        </Button>
      </div>

      {/* 메인 콘텐츠 */}
      <div className="flex flex-1 overflow-hidden">
        {/* 왼쪽 패널 - 설정 */}
        <div className="w-64 flex-shrink-0 overflow-y-auto border-r bg-white p-4">
          <AngleSettings />
        </div>

        {/* 중앙 - 프리뷰 */}
        <div className="flex-1 p-4">
          <AnglePreview />
        </div>

        {/* 오른쪽 패널 - 자재 목록 */}
        <div className="w-72 flex-shrink-0 overflow-y-auto border-l bg-white p-4">
          <AngleMaterialList />
        </div>
      </div>
    </div>
  );
}

export function AngleModeler() {
  return (
    <AngleProvider>
      <ModelerContent />
    </AngleProvider>
  );
}
