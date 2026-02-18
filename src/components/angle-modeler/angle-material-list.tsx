'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useAngleModeler } from './angle-context';

interface BOM {
  postBarLength: number;   // 기둥 바 길이 (mm)
  postBarCount: number;    // 기둥 바 개수
  shelfCount: number;      // 선반 수
  shelfWidth: number;      // 선반 폭 (mm)
  shelfDepth: number;      // 선반 깊이 (mm)
  crossBarCount: number;   // 가로 연결 바 수 (선반당 앞뒤 2개)
  sideBarCount: number;    // 측면 연결 바 수 (선반당 양쪽 2개)
  totalBarLength: number;  // 총 바 길이 (mm)
}

export function AngleMaterialList() {
  const { state } = useAngleModeler();
  const { width, depth, height, shelves, posts, postSize } = state;

  const bom = useMemo<BOM>(() => {
    const postBarCount = posts.length * 4; // 기둥당 4개 (앞뒤좌우 모서리)
    const postBarLength = height;

    // 각 선반의 가로바: 앞+뒤 각각 (기둥 수 - 1)개 구간 → 선반당 2 × (기둥수-1)
    // 실제로는 선반마다 폭 방향 바 2개(앞/뒤), 깊이 방향 바 2개(좌/우) per 기둥 간격
    const crossBarCount = shelves.length * 2; // 앞뒤 가로바
    const sideBarCount = shelves.length * 2;  // 양쪽 측면바

    // 선반 사이 구간별 폭
    const sections: number[] = [];
    for (let i = 1; i < posts.length; i++) {
      sections.push(posts[i].x - posts[i - 1].x);
    }

    const totalCrossBarLength = crossBarCount * width;
    const totalSideBarLength = sideBarCount * depth;
    const totalPostBarLength = postBarCount * postBarLength;
    const totalBarLength = totalPostBarLength + totalCrossBarLength + totalSideBarLength;

    return {
      postBarLength,
      postBarCount,
      shelfCount: shelves.length,
      shelfWidth: width,
      shelfDepth: depth,
      crossBarCount,
      sideBarCount,
      totalBarLength,
    };
  }, [width, depth, height, shelves, posts, postSize]);

  const formatMm = (mm: number) => `${mm.toLocaleString()}mm`;
  const formatM = (mm: number) => `${(mm / 1000).toFixed(1)}m`;

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold">자재 소요 (BOM)</h3>

      <Card>
        <CardHeader className="px-4 py-3">
          <CardTitle className="text-sm">기둥 (포스트)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 px-4 pb-4 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">기둥 수</span>
            <span className="font-medium">{posts.length}개 × 4모서리</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">기둥 길이</span>
            <span className="font-medium">{formatMm(bom.postBarLength)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">기둥 바 수량</span>
            <span className="font-bold">{bom.postBarCount}개</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="px-4 py-3">
          <CardTitle className="text-sm">선반 & 연결바</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 px-4 pb-4 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">선반 수</span>
            <span className="font-medium">{bom.shelfCount}개</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">선반 크기</span>
            <span className="font-medium">
              {formatMm(bom.shelfWidth)} × {formatMm(bom.shelfDepth)}
            </span>
          </div>
          <Separator />
          <div className="flex justify-between">
            <span className="text-muted-foreground">가로바 (앞/뒤)</span>
            <span className="font-medium">{bom.crossBarCount}개</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">측면바 (좌/우)</span>
            <span className="font-medium">{bom.sideBarCount}개</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="px-4 py-3">
          <CardTitle className="text-sm">총 자재 요약</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 px-4 pb-4 text-sm">
          <div className="flex justify-between text-base font-bold">
            <span>총 바 길이</span>
            <span className="text-primary">{formatM(bom.totalBarLength)}</span>
          </div>
          <div className="mt-2 rounded bg-muted p-2 text-xs text-muted-foreground">
            <p>기둥바 {bom.postBarCount}개 + 가로바 {bom.crossBarCount}개 + 측면바 {bom.sideBarCount}개</p>
            <p>선반판 {bom.shelfCount}장 ({formatMm(bom.shelfWidth)}×{formatMm(bom.shelfDepth)})</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
