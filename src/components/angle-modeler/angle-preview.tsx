'use client';

import { useRef, useCallback } from 'react';
import { useAngleModeler } from './angle-context';

const PADDING = 40;
const LABEL_OFFSET = 30;

export function AnglePreview() {
  const { state, dispatch } = useAngleModeler();
  const svgRef = useRef<SVGSVGElement>(null);

  const { width, height, shelves, posts, postSize, shelfThickness, color, selectedShelfId, selectedPostId } = state;

  // SVG 뷰박스 계산 (정면도)
  const viewW = width + PADDING * 2 + LABEL_OFFSET;
  const viewH = height + PADDING * 2 + LABEL_OFFSET;

  // mm → SVG 좌표 변환 (y축 반전: 바닥이 아래)
  const toX = (mm: number) => PADDING + LABEL_OFFSET + mm;
  const toY = (mm: number) => PADDING + (height - mm);

  const colorMap = {
    white: { post: '#d4d4d4', shelf: '#e5e5e5', stroke: '#a3a3a3' },
    black: { post: '#404040', shelf: '#525252', stroke: '#262626' },
    silver: { post: '#9ca3af', shelf: '#d1d5db', stroke: '#6b7280' },
  };
  const colors = colorMap[color];

  // 선반 클릭으로 추가
  const handleSvgClick = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      if (!svgRef.current) return;
      const rect = svgRef.current.getBoundingClientRect();
      const scaleY = viewH / rect.height;
      const clickY = (e.clientY - rect.top) * scaleY;
      const mmY = height - (clickY - PADDING);
      // 유효 범위 내 클릭만 처리
      if (mmY > 0 && mmY < height) {
        const snapped = Math.round(mmY / 10) * 10; // 10mm 단위 스냅
        dispatch({ type: 'ADD_SHELF', payload: { y: snapped } });
      }
    },
    [dispatch, height, viewH]
  );

  return (
    <div className="flex h-full flex-col">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold">정면도 (Front View)</h3>
        <span className="text-xs text-muted-foreground">빈 공간 클릭 → 선반 추가</span>
      </div>

      <div className="flex-1 rounded-lg border bg-white p-2">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${viewW} ${viewH}`}
          className="h-full w-full"
          style={{ maxHeight: '100%' }}
          onClick={handleSvgClick}
        >
          {/* 기둥 (Posts) */}
          {posts.map((post) => {
            const isSelected = selectedPostId === post.id;
            const x = toX(post.x) - postSize / 2;
            return (
              <g key={post.id}>
                <rect
                  x={x}
                  y={toY(height)}
                  width={postSize}
                  height={height}
                  fill={colors.post}
                  stroke={isSelected ? '#3b82f6' : colors.stroke}
                  strokeWidth={isSelected ? 2 : 1}
                  className="cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    dispatch({ type: 'SELECT_POST', payload: isSelected ? null : post.id });
                  }}
                />
                {/* 기둥 위치 라벨 */}
                <text
                  x={toX(post.x)}
                  y={toY(0) + 16}
                  textAnchor="middle"
                  fontSize="10"
                  fill="#6b7280"
                >
                  {post.x}
                </text>
              </g>
            );
          })}

          {/* 선반 (Shelves) */}
          {shelves.map((shelf) => {
            const isSelected = selectedShelfId === shelf.id;
            const leftX = toX(0);
            const shelfW = width;
            const y = toY(shelf.y) - shelfThickness / 2;
            return (
              <g key={shelf.id}>
                <rect
                  x={leftX}
                  y={y}
                  width={shelfW}
                  height={shelfThickness}
                  fill={colors.shelf}
                  stroke={isSelected ? '#3b82f6' : colors.stroke}
                  strokeWidth={isSelected ? 2 : 1}
                  className="cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    dispatch({ type: 'SELECT_SHELF', payload: isSelected ? null : shelf.id });
                  }}
                />
                {/* 선반 높이 라벨 (왼쪽) */}
                <text
                  x={toX(0) - 8}
                  y={toY(shelf.y) + 4}
                  textAnchor="end"
                  fontSize="10"
                  fill={isSelected ? '#3b82f6' : '#6b7280'}
                >
                  {shelf.y}mm
                </text>
              </g>
            );
          })}

          {/* 전체 치수 표시 */}
          {/* 폭 */}
          <line
            x1={toX(0)}
            y1={toY(height) - 12}
            x2={toX(width)}
            y2={toY(height) - 12}
            stroke="#9ca3af"
            strokeWidth={0.5}
            markerEnd="url(#arrowR)"
            markerStart="url(#arrowL)"
          />
          <text
            x={toX(width / 2)}
            y={toY(height) - 16}
            textAnchor="middle"
            fontSize="11"
            fontWeight="bold"
            fill="#374151"
          >
            {width}mm
          </text>

          {/* 높이 */}
          <line
            x1={toX(width) + 20}
            y1={toY(0)}
            x2={toX(width) + 20}
            y2={toY(height)}
            stroke="#9ca3af"
            strokeWidth={0.5}
          />
          <text
            x={toX(width) + 24}
            y={toY(height / 2) + 4}
            textAnchor="start"
            fontSize="11"
            fontWeight="bold"
            fill="#374151"
            transform={`rotate(-90, ${toX(width) + 24}, ${toY(height / 2)})`}
          >
            {height}mm
          </text>

          {/* 선반 간격 표시 */}
          {shelves.map((shelf, i) => {
            if (i === 0) return null;
            const gap = shelf.y - shelves[i - 1].y;
            const midY = toY(shelves[i - 1].y + gap / 2);
            return (
              <text
                key={`gap-${shelf.id}`}
                x={toX(width / 2)}
                y={midY + 4}
                textAnchor="middle"
                fontSize="9"
                fill="#9ca3af"
              >
                {gap}mm
              </text>
            );
          })}

          {/* 화살표 마커 */}
          <defs>
            <marker id="arrowR" markerWidth="6" markerHeight="6" refX="6" refY="3" orient="auto">
              <path d="M0,0 L6,3 L0,6" fill="none" stroke="#9ca3af" strokeWidth="1" />
            </marker>
            <marker id="arrowL" markerWidth="6" markerHeight="6" refX="0" refY="3" orient="auto">
              <path d="M6,0 L0,3 L6,6" fill="none" stroke="#9ca3af" strokeWidth="1" />
            </marker>
          </defs>
        </svg>
      </div>
    </div>
  );
}
