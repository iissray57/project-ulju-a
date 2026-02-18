'use client';

import { useState } from 'react';
import { CurtainProvider } from './curtain-context';
import { CurtainPreview } from './curtain-preview';
import { Curtain3DView } from './curtain-3d-view';
import { CurtainSettings } from './curtain-settings';
import { MaterialCalculator } from './material-calculator';
import { ProductPicker } from './product-picker';
import { Button } from '@/components/ui/button';
import { RotateCcw, Square, Box } from 'lucide-react';
import { useCurtainModeler } from './curtain-context';
import { cn } from '@/lib/utils';

function ModelerContent() {
  const { reset } = useCurtainModeler();
  const [viewMode, setViewMode] = useState<'2d' | '3d'>('2d');

  return (
    <div className="-m-4 md:-m-6 -mb-20 lg:-mb-6 flex flex-col" style={{ height: 'calc(100dvh - 3.5rem)' }}>
      {/* 툴바 */}
      <div className="flex items-center justify-between border-b bg-white px-4 py-2">
        <h1 className="text-lg font-bold">커튼 모델러</h1>
        <div className="flex items-center gap-2">
          {/* 2D/3D 토글 */}
          <div className="flex rounded-md border">
            <button
              type="button"
              className={cn(
                'flex items-center gap-1 px-3 py-1.5 text-xs font-medium transition-colors',
                viewMode === '2d'
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-muted'
              )}
              onClick={() => setViewMode('2d')}
            >
              <Square className="h-3.5 w-3.5" />
              2D
            </button>
            <button
              type="button"
              className={cn(
                'flex items-center gap-1 px-3 py-1.5 text-xs font-medium transition-colors',
                viewMode === '3d'
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-muted'
              )}
              onClick={() => setViewMode('3d')}
            >
              <Box className="h-3.5 w-3.5" />
              3D
            </button>
          </div>

          <Button variant="outline" size="sm" onClick={reset}>
            <RotateCcw className="h-4 w-4 mr-1" />
            초기화
          </Button>
        </div>
      </div>

      {/* 메인 콘텐츠 */}
      <div className="flex flex-1 overflow-hidden">
        {/* 왼쪽 패널 - 설정 */}
        <div className="w-64 flex-shrink-0 overflow-y-auto border-r bg-white p-4">
          <CurtainSettings />
        </div>

        {/* 중앙 - 프리뷰 */}
        <div className="flex-1 p-4">
          {viewMode === '2d' ? <CurtainPreview /> : <Curtain3DView />}
        </div>

        {/* 오른쪽 패널 - 제품 선택 + 자재 계산 */}
        <div className="w-72 flex-shrink-0 overflow-y-auto border-l bg-white p-4 space-y-6">
          <ProductPicker />
          <MaterialCalculator />
        </div>
      </div>
    </div>
  );
}

export function CurtainModeler() {
  return (
    <CurtainProvider>
      <ModelerContent />
    </CurtainProvider>
  );
}
