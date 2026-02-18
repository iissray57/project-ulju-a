'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useCurtainModeler } from './curtain-context';

const FABRIC_WIDTH_NARROW = 1500;
const FABRIC_WIDTH_WIDE = 2800;

interface FabricEstimate {
  fabricWidthNeeded: number;
  fabricHeightNeeded: number;
  panelCount: number;
  totalFabricLength: number; // m
  wideEstimate: number;     // 광폭 사용 시 (m)
}

interface MaterialEstimate {
  railLength: number;
  outer: FabricEstimate;
  inner: FabricEstimate | null; // 2중 커튼일 때
  blindWidth: number;
  blindHeight: number;
  blindSections?: number;
  blindSectionWidth?: number;
}

function calcFabric(
  winWidth: number,
  winHeight: number,
  sillHeight: number,
  foldMultiplier: number,
  curtainLength: string,
  railExtension: number,
): FabricEstimate {
  const railLength = winWidth + railExtension * 2;

  let curtainHeight: number;
  if (curtainLength === 'sill') {
    curtainHeight = winHeight;
  } else if (curtainLength === 'below-sill') {
    curtainHeight = winHeight + 150;
  } else {
    curtainHeight = winHeight + sillHeight - 20;
  }

  const fabricHeightNeeded = curtainHeight + 200;
  const fabricWidthNeeded = railLength * foldMultiplier;
  const panelCount = Math.ceil(fabricWidthNeeded / FABRIC_WIDTH_NARROW);
  const totalFabricLength = (panelCount * fabricHeightNeeded) / 1000;
  const wideEstimate = (Math.ceil(fabricWidthNeeded / FABRIC_WIDTH_WIDE) * fabricHeightNeeded) / 1000;

  return { fabricWidthNeeded, fabricHeightNeeded, panelCount, totalFabricLength, wideEstimate };
}

export function MaterialCalculator() {
  const { state } = useCurtainModeler();
  const { window: win, config } = state;

  const estimate = useMemo<MaterialEstimate>(() => {
    const railLength = win.width + config.railExtension * 2;

    if (config.productType === 'blind') {
      const sections = config.blindSections || 1;
      const gap = (sections - 1) * 10; // 섹션 간 간격 10mm
      const sectionWidth = Math.round((win.width - gap) / sections) + 20; // 양쪽 10mm 여유
      return {
        railLength,
        outer: { fabricWidthNeeded: 0, fabricHeightNeeded: 0, panelCount: 0, totalFabricLength: 0, wideEstimate: 0 },
        inner: null,
        blindWidth: win.width + 40,
        blindHeight: win.height + 40,
        blindSections: sections,
        blindSectionWidth: sectionWidth,
      };
    }

    const outer = calcFabric(win.width, win.height, win.sillHeight, config.foldMultiplier, config.curtainLength, config.railExtension);

    // 속커튼: 주름 배율 1.5~2.0 (겉보다 적게), 같은 길이
    const inner = config.doubleCurtain
      ? calcFabric(win.width, win.height, win.sillHeight, Math.min(config.foldMultiplier, 2.0), config.curtainLength, config.railExtension)
      : null;

    return { railLength, outer, inner, blindWidth: 0, blindHeight: 0, blindSections: 1, blindSectionWidth: 0 };
  }, [win, config]);

  const formatMm = (mm: number) => `${mm.toLocaleString()}mm`;
  const formatM = (m: number) => `${m.toFixed(1)}m`;
  const formatWon = (won: number) => `${won.toLocaleString('ko-KR')}원`;

  // 단가 계산
  const outerCost = config.selectedProductPrice && estimate.outer.totalFabricLength > 0
    ? Math.round(config.selectedProductPrice * estimate.outer.totalFabricLength)
    : null;
  const innerCost = config.innerProductPrice && estimate.inner && estimate.inner.totalFabricLength > 0
    ? Math.round(config.innerProductPrice * estimate.inner.totalFabricLength)
    : null;
  const totalCost = (outerCost ?? 0) + (innerCost ?? 0);

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-sm">자재 소요 / 단가</h3>

      {config.productType === 'curtain' ? (
        <>
          {/* 겉커튼 원단 */}
          <Card>
            <CardHeader className="py-3 px-4">
              <CardTitle className="text-sm">
                {config.doubleCurtain ? '겉커튼 원단' : '커튼 원단'}
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">레일 길이</span>
                <span className="font-medium">{formatMm(estimate.railLength)}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">필요 폭 (주름 포함)</span>
                <span className="font-medium">{formatMm(Math.round(estimate.outer.fabricWidthNeeded))}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">필요 높이 (여유 포함)</span>
                <span className="font-medium">{formatMm(estimate.outer.fabricHeightNeeded)}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">폭 수 (150cm)</span>
                <span className="font-medium">{estimate.outer.panelCount}폭</span>
              </div>
              <div className="flex justify-between font-bold">
                <span>원단 소요량</span>
                <span className="text-primary">{formatM(estimate.outer.totalFabricLength)}</span>
              </div>

              {/* 단가 */}
              {config.selectedProductPrice && (
                <>
                  <Separator />
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">
                      단가 ({config.selectedProductName})
                    </span>
                    <span>{formatWon(config.selectedProductPrice)}/m</span>
                  </div>
                  <div className="flex justify-between font-bold text-base">
                    <span>겉커튼 예상 금액</span>
                    <span className="text-primary">{formatWon(outerCost!)}</span>
                  </div>
                </>
              )}

              {estimate.outer.totalFabricLength > 0 && (
                <div className="mt-1 p-2 bg-muted rounded text-xs text-muted-foreground">
                  280cm 광폭 시: {formatM(estimate.outer.wideEstimate)}
                </div>
              )}
            </CardContent>
          </Card>

          {/* 속커튼 원단 (2중) */}
          {config.doubleCurtain && estimate.inner && (
            <Card>
              <CardHeader className="py-3 px-4">
                <CardTitle className="text-sm">속커튼 원단</CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">필요 폭 (주름 포함)</span>
                  <span className="font-medium">{formatMm(Math.round(estimate.inner.fabricWidthNeeded))}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">폭 수 (150cm)</span>
                  <span className="font-medium">{estimate.inner.panelCount}폭</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span>원단 소요량</span>
                  <span className="text-primary">{formatM(estimate.inner.totalFabricLength)}</span>
                </div>

                {config.innerProductPrice && (
                  <>
                    <Separator />
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">
                        단가 ({config.innerProductName})
                      </span>
                      <span>{formatWon(config.innerProductPrice)}/m</span>
                    </div>
                    <div className="flex justify-between font-bold text-base">
                      <span>속커튼 예상 금액</span>
                      <span className="text-primary">{formatWon(innerCost!)}</span>
                    </div>
                  </>
                )}

                <div className="mt-1 p-2 bg-muted rounded text-xs text-muted-foreground">
                  280cm 광폭 시: {formatM(estimate.inner.wideEstimate)}
                </div>
              </CardContent>
            </Card>
          )}

          {/* 총 합계 */}
          {(outerCost || innerCost) && (
            <Card className="border-primary/30 bg-primary/5">
              <CardContent className="px-4 py-3">
                <div className="flex justify-between text-base font-bold">
                  <span>총 예상 금액</span>
                  <span className="text-primary">{formatWon(totalCost)}</span>
                </div>
                {config.doubleCurtain && (
                  <div className="mt-1 text-xs text-muted-foreground">
                    겉 {outerCost ? formatWon(outerCost) : '-'} + 속 {innerCost ? formatWon(innerCost) : '-'}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* 제품 미선택 안내 */}
          {!config.selectedProductId && (
            <div className="p-2 rounded border border-dashed text-xs text-muted-foreground text-center">
              제품을 선택하면 예상 단가가 계산됩니다
            </div>
          )}
        </>
      ) : (
        <Card>
          <CardHeader className="py-3 px-4">
            <CardTitle className="text-sm">
              블라인드 규격 {(estimate.blindSections ?? 1) > 1 && `(${estimate.blindSections}분할)`}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">전체 폭</span>
              <span className="font-medium">{formatMm(estimate.blindWidth)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">높이</span>
              <span className="font-medium">{formatMm(estimate.blindHeight)}</span>
            </div>

            {(estimate.blindSections ?? 1) > 1 && (
              <>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">분할 수</span>
                  <span className="font-medium">{estimate.blindSections}단</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">개별 폭</span>
                  <span className="font-medium">{formatMm(estimate.blindSectionWidth!)}</span>
                </div>
              </>
            )}

            <Separator />
            <div className="flex justify-between">
              <span className="text-muted-foreground">주문 규격</span>
              {(estimate.blindSections ?? 1) > 1 ? (
                <span className="font-bold text-primary">
                  {estimate.blindSectionWidth}×{estimate.blindHeight}mm × {estimate.blindSections}
                </span>
              ) : (
                <span className="font-bold text-primary">
                  {estimate.blindWidth}×{estimate.blindHeight}mm
                </span>
              )}
            </div>
            {config.selectedProductPrice && (
              <>
                <Separator />
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">{config.selectedProductName}</span>
                  <span>{formatWon(config.selectedProductPrice)} × {estimate.blindSections ?? 1}개</span>
                </div>
                <div className="flex justify-between font-bold text-base">
                  <span>예상 금액</span>
                  <span className="text-primary">
                    {formatWon(config.selectedProductPrice * (estimate.blindSections ?? 1))}
                  </span>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
