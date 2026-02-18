'use client';

import { useMemo } from 'react';
import { useCurtainModeler, type CurtainStyle, type BlindStyle } from './curtain-context';

const SVG_WIDTH = 800;
const SVG_HEIGHT = 600;
const PADDING = 60;

// 커튼 주름 패스 생성
function generateCurtainPath(
  x: number,
  y: number,
  width: number,
  height: number,
  folds: number
): string {
  const foldWidth = width / folds;
  let d = `M ${x} ${y}`;

  for (let i = 0; i < folds; i++) {
    const fx = x + i * foldWidth;
    d += ` C ${fx + foldWidth * 0.25} ${y}, ${fx + foldWidth * 0.25} ${y}, ${fx + foldWidth * 0.5} ${y}`;
    d += ` C ${fx + foldWidth * 0.75} ${y}, ${fx + foldWidth * 0.75} ${y}, ${fx + foldWidth} ${y}`;
  }

  d += ` L ${x + width} ${y + height}`;

  for (let i = folds - 1; i >= 0; i--) {
    const fx = x + i * foldWidth;
    d += ` L ${fx} ${y + height}`;
  }

  d += ' Z';
  return d;
}

// 스타일별 기본 불투명도
const STYLE_OPACITY: Record<CurtainStyle, number> = {
  drape: 0.85,
  sheer: 0.35,
  blackout: 0.95,
  roman: 0.8,
  cafe: 0.7,
};

const BLIND_COLORS: Record<BlindStyle, { fill: string; stroke: string }> = {
  roller: { fill: '#E8E0D4', stroke: '#C4B8A8' },
  venetian: { fill: '#D4C4A8', stroke: '#B0A088' },
  vertical: { fill: '#DDD8D0', stroke: '#B8B0A4' },
  honeycomb: { fill: '#E0D8CC', stroke: '#C8BCA8' },
  combi: { fill: '#F0E8DC', stroke: '#D4C8B4' },
};

// 색상을 약간 어둡게 (stroke용)
function darkenColor(hex: string): string {
  const r = Math.max(0, parseInt(hex.slice(1, 3), 16) - 40);
  const g = Math.max(0, parseInt(hex.slice(3, 5), 16) - 40);
  const b = Math.max(0, parseInt(hex.slice(5, 7), 16) - 40);
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

function CurtainSvg() {
  const { state } = useCurtainModeler();
  const { window: win, config } = state;

  const layout = useMemo(() => {
    const maxDim = Math.max(win.width + config.railExtension * 2, win.height + win.sillHeight);
    const scale = (SVG_WIDTH - PADDING * 2) / maxDim;

    const totalRailWidth = win.width + config.railExtension * 2;
    const railW = totalRailWidth * scale;
    const winW = win.width * scale;
    const winH = win.height * scale;
    const sillH = win.sillHeight * scale;

    const railX = (SVG_WIDTH - railW) / 2;
    const railY = PADDING + 20;
    const winX = (SVG_WIDTH - winW) / 2;
    const winY = railY + 10;

    let curtainH: number;
    if (config.curtainLength === 'sill') {
      curtainH = winH;
    } else if (config.curtainLength === 'below-sill') {
      curtainH = winH + 80 * scale;
    } else {
      curtainH = winH + sillH - 10;
    }

    return { scale, railW, railX, railY, winW, winH, winX, winY, sillH, curtainH };
  }, [win, config.railExtension, config.curtainLength]);

  const { railW, railX, railY, winW, winH, winX, winY, sillH, curtainH } = layout;

  return (
    <svg
      viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
      className="w-full h-full"
      style={{ background: '#FAFAF8' }}
    >
      {/* 바닥선 */}
      <line
        x1={40}
        y1={winY + winH + sillH}
        x2={SVG_WIDTH - 40}
        y2={winY + winH + sillH}
        stroke="#9CA3AF"
        strokeWidth={2}
        strokeDasharray="8,4"
      />
      <text x={SVG_WIDTH - 38} y={winY + winH + sillH - 4} fontSize={10} fill="#9CA3AF" textAnchor="end">
        바닥
      </text>

      {/* 벽 */}
      <rect
        x={winX - 20}
        y={PADDING}
        width={winW + 40}
        height={winH + sillH + 30}
        fill="#F3F0EB"
        stroke="#D1C9BC"
        strokeWidth={1}
        rx={2}
      />

      {/* 창문 프레임 */}
      <rect x={winX} y={winY} width={winW} height={winH} fill="#D6EAF8" stroke="#85929E" strokeWidth={2} rx={1} />
      {/* 창살 */}
      <line x1={winX + winW / 2} y1={winY} x2={winX + winW / 2} y2={winY + winH} stroke="#85929E" strokeWidth={1.5} />
      <line x1={winX} y1={winY + winH / 2} x2={winX + winW} y2={winY + winH / 2} stroke="#85929E" strokeWidth={1.5} />

      {/* 창대 */}
      <rect x={winX - 10} y={winY + winH} width={winW + 20} height={6} fill="#B8A898" rx={1} />

      {/* 커튼 또는 블라인드 */}
      {config.productType === 'curtain' ? (
        <>
          {/* 2중 커튼: 속커튼 먼저 (뒤) */}
          {config.doubleCurtain && (
            <CurtainFabric
              railX={railX}
              railY={railY}
              railW={railW}
              curtainH={curtainH}
              curtainColor={config.innerCurtainColor}
              curtainStyle={config.innerCurtainStyle}
              foldMultiplier={config.foldMultiplier}
              splitCenter={config.splitCenter}
              openRatio={0}
              isInner
            />
          )}
          {/* 겉커튼 (앞) */}
          <CurtainFabric
            railX={railX}
            railY={railY}
            railW={railW}
            curtainH={curtainH}
            curtainColor={config.curtainColor}
            curtainStyle={config.curtainStyle}
            foldMultiplier={config.foldMultiplier}
            splitCenter={config.splitCenter}
            openRatio={config.openRatio}
            isInner={false}
          />
        </>
      ) : (
        <BlindSectioned
          winX={winX}
          winY={winY}
          winW={winW}
          winH={winH}
          sections={config.blindSections}
          config={config}
        />
      )}

      {/* 레일/봉 (커튼 위에 그려서 레일이 보이게) */}
      {config.productType === 'curtain' && config.doubleCurtain ? (
        <>
          {/* 2중 레일 */}
          <rect x={railX} y={railY - 8} width={railW} height={6} fill="#8B7D6B" rx={3} />
          <rect x={railX} y={railY} width={railW} height={6} fill="#8B7D6B" rx={3} />
          <circle cx={railX} cy={railY - 5} r={5} fill="#6B5D4B" />
          <circle cx={railX + railW} cy={railY - 5} r={5} fill="#6B5D4B" />
          <circle cx={railX} cy={railY + 3} r={5} fill="#6B5D4B" />
          <circle cx={railX + railW} cy={railY + 3} r={5} fill="#6B5D4B" />
        </>
      ) : (
        <>
          <rect x={railX} y={railY - 4} width={railW} height={8} fill="#8B7D6B" rx={4} />
          <circle cx={railX} cy={railY} r={6} fill="#6B5D4B" />
          <circle cx={railX + railW} cy={railY} r={6} fill="#6B5D4B" />
        </>
      )}

      {/* 치수 표기 */}
      <DimensionLabels
        win={win}
        railX={railX}
        railY={railY}
        railW={railW}
        winX={winX}
        winY={winY}
        winW={winW}
        winH={winH}
        sillH={sillH}
      />
    </svg>
  );
}

function CurtainFabric({
  railX,
  railY,
  railW,
  curtainH,
  curtainColor,
  curtainStyle,
  foldMultiplier,
  splitCenter,
  openRatio,
  isInner,
}: {
  railX: number;
  railY: number;
  railW: number;
  curtainH: number;
  curtainColor: string;
  curtainStyle: CurtainStyle;
  foldMultiplier: number;
  splitCenter: boolean;
  openRatio: number;
  isInner: boolean;
}) {
  const opacity = STYLE_OPACITY[curtainStyle];
  const stroke = darkenColor(curtainColor);
  const foldCount = Math.round(foldMultiplier * 8);
  const yOffset = isInner ? railY + 2 : railY + 4;

  // 개폐: openRatio 만큼 양쪽으로 걷힘
  // 0 = 닫힘 (전체 폭 사용), 1 = 완전 열림 (양쪽 작은 뭉치)
  const closedWidth = railW - 8;
  const minBundleW = 30; // 완전 열었을 때 양쪽 뭉치 폭

  if (splitCenter) {
    const halfClosed = closedWidth / 2 - 5;
    const openW = halfClosed * (1 - openRatio) + minBundleW * openRatio;
    const leftHalfFolds = Math.max(2, Math.ceil((foldCount / 2) * (openRatio < 0.9 ? 1 : 0.5)));
    const rightHalfFolds = leftHalfFolds;

    // 열리면 양쪽 끝으로 이동
    const leftX = railX + 4;
    const rightX = railX + railW - 4 - openW;

    return (
      <g opacity={opacity}>
        {/* 왼쪽 커튼 */}
        <path
          d={generateCurtainPath(leftX, yOffset, openW, curtainH, leftHalfFolds)}
          fill={curtainColor}
          stroke={stroke}
          strokeWidth={0.5}
        />
        {/* 왼쪽 주름선 */}
        {Array.from({ length: leftHalfFolds }).map((_, i) => {
          const step = openW / leftHalfFolds;
          return (
            <line
              key={`lf-${i}`}
              x1={leftX + i * step + step / 2}
              y1={yOffset}
              x2={leftX + i * step + step / 2}
              y2={yOffset + curtainH}
              stroke={stroke}
              strokeWidth={openRatio > 0.5 ? 0.6 : 0.3}
              opacity={0.4}
            />
          );
        })}

        {/* 오른쪽 커튼 */}
        <path
          d={generateCurtainPath(rightX, yOffset, openW, curtainH, rightHalfFolds)}
          fill={curtainColor}
          stroke={stroke}
          strokeWidth={0.5}
        />
        {/* 오른쪽 주름선 */}
        {Array.from({ length: rightHalfFolds }).map((_, i) => {
          const step = openW / rightHalfFolds;
          return (
            <line
              key={`rf-${i}`}
              x1={rightX + i * step + step / 2}
              y1={yOffset}
              x2={rightX + i * step + step / 2}
              y2={yOffset + curtainH}
              stroke={stroke}
              strokeWidth={openRatio > 0.5 ? 0.6 : 0.3}
              opacity={0.4}
            />
          );
        })}
      </g>
    );
  }

  // 한개 커튼 - 한쪽으로 걷힘
  const openW = closedWidth * (1 - openRatio) + minBundleW * openRatio;
  const curtainFolds = Math.max(2, Math.ceil(foldCount * (openRatio < 0.9 ? 1 : 0.5)));

  return (
    <g opacity={opacity}>
      <path
        d={generateCurtainPath(railX + 4, yOffset, openW, curtainH, curtainFolds)}
        fill={curtainColor}
        stroke={stroke}
        strokeWidth={0.5}
      />
      {Array.from({ length: curtainFolds }).map((_, i) => {
        const step = openW / curtainFolds;
        return (
          <line
            key={`f-${i}`}
            x1={railX + 4 + i * step + step / 2}
            y1={yOffset}
            x2={railX + 4 + i * step + step / 2}
            y2={yOffset + curtainH}
            stroke={stroke}
            strokeWidth={openRatio > 0.5 ? 0.6 : 0.3}
            opacity={0.4}
          />
        );
      })}
    </g>
  );
}

/** 분할 래퍼: sections만큼 BlindSlats를 나란히 배치 */
function BlindSectioned({
  winX, winY, winW, winH, sections, config,
}: {
  winX: number; winY: number; winW: number; winH: number;
  sections: number;
  config: { blindStyle: BlindStyle; slatAngle: number };
}) {
  const gap = 4; // 섹션 사이 간격
  const totalGap = (sections - 1) * gap;
  const sectionW = (winW - totalGap) / sections;

  return (
    <g>
      {Array.from({ length: sections }).map((_, i) => {
        const sx = winX + i * (sectionW + gap);
        return (
          <g key={`section-${i}`}>
            <BlindSlats
              winX={sx}
              winY={winY}
              winW={sectionW}
              winH={winH}
              config={config}
            />
            {/* 섹션 구분선 */}
            {i < sections - 1 && (
              <line
                x1={sx + sectionW + gap / 2}
                y1={winY}
                x2={sx + sectionW + gap / 2}
                y2={winY + winH}
                stroke="#85929E"
                strokeWidth={1.5}
              />
            )}
          </g>
        );
      })}
      {/* 분할 라벨 */}
      {sections > 1 && (
        <text
          x={winX + winW / 2}
          y={winY + winH + 14}
          textAnchor="middle"
          fontSize={9}
          fill="#6B7280"
        >
          {sections}분할 (각 {Math.round(winW / sections)}px)
        </text>
      )}
    </g>
  );
}

function BlindSlats({
  winX,
  winY,
  winW,
  winH,
  config,
}: {
  winX: number;
  winY: number;
  winW: number;
  winH: number;
  config: { blindStyle: BlindStyle; slatAngle: number };
}) {
  const colors = BLIND_COLORS[config.blindStyle];

  if (config.blindStyle === 'roller' || config.blindStyle === 'combi') {
    const rollH = 16;
    return (
      <g>
        <rect x={winX + 2} y={winY + 2} width={winW - 4} height={rollH} fill="#7D6B5D" rx={rollH / 2} />
        <rect
          x={winX + 4}
          y={winY + rollH}
          width={winW - 8}
          height={winH - rollH - 4}
          fill={colors.fill}
          stroke={colors.stroke}
          strokeWidth={0.5}
          opacity={0.8}
          rx={1}
        />
        {config.blindStyle === 'combi' &&
          Array.from({ length: Math.floor((winH - rollH) / 20) }).map((_, i) => (
            <line
              key={i}
              x1={winX + 4}
              y1={winY + rollH + i * 20 + 10}
              x2={winX + winW - 4}
              y2={winY + rollH + i * 20 + 10}
              stroke={colors.stroke}
              strokeWidth={0.3}
              opacity={i % 2 === 0 ? 0.6 : 0.2}
            />
          ))}
        <rect x={winX + winW / 2 - 10} y={winY + winH - 6} width={20} height={4} fill="#7D6B5D" rx={2} />
      </g>
    );
  }

  if (config.blindStyle === 'vertical') {
    const slatCount = Math.max(1, Math.floor(winW / 16));
    const slatW = (winW - 8) / slatCount;
    return (
      <g>
        <rect x={winX + 2} y={winY + 2} width={winW - 4} height={10} fill="#7D6B5D" rx={2} />
        {Array.from({ length: slatCount }).map((_, i) => {
          const angle = config.slatAngle;
          const offsetX = Math.sin((angle * Math.PI) / 180) * slatW * 0.3;
          return (
            <rect
              key={i}
              x={winX + 4 + i * slatW + offsetX}
              y={winY + 14}
              width={slatW * 0.7}
              height={winH - 18}
              fill={colors.fill}
              stroke={colors.stroke}
              strokeWidth={0.3}
              rx={1}
              opacity={0.85}
            />
          );
        })}
      </g>
    );
  }

  const slatSpacing = config.blindStyle === 'honeycomb' ? 14 : 10;
  const slatCount = Math.floor((winH - 20) / slatSpacing);
  return (
    <g>
      <rect x={winX + 2} y={winY + 2} width={winW - 4} height={10} fill="#7D6B5D" rx={2} />
      {Array.from({ length: slatCount }).map((_, i) => {
        const sy = winY + 16 + i * slatSpacing;
        const slatH = config.blindStyle === 'honeycomb' ? 12 : 4;
        const angle = config.slatAngle;
        const tiltOffset = Math.sin((angle * Math.PI) / 180) * 3;
        return (
          <rect
            key={i}
            x={winX + 4}
            y={sy + tiltOffset * (i % 2 === 0 ? 1 : -1)}
            width={winW - 8}
            height={slatH}
            fill={colors.fill}
            stroke={colors.stroke}
            strokeWidth={0.3}
            rx={config.blindStyle === 'honeycomb' ? 3 : 0.5}
            opacity={0.8}
          />
        );
      })}
      <rect x={winX + 4} y={winY + winH - 8} width={winW - 8} height={4} fill="#7D6B5D" rx={2} />
    </g>
  );
}

function DimensionLabels({
  win,
  railX,
  railY,
  railW,
  winX,
  winY,
  winW,
  winH,
  sillH,
}: {
  win: { width: number; height: number; sillHeight: number };
  railX: number;
  railY: number;
  railW: number;
  winX: number;
  winY: number;
  winW: number;
  winH: number;
  sillH: number;
}) {
  return (
    <g fontSize={10} fill="#6B7280">
      <line x1={winX} y1={winY - 14} x2={winX + winW} y2={winY - 14} stroke="#9CA3AF" strokeWidth={0.8} markerEnd="url(#arrow)" markerStart="url(#arrow-start)" />
      <text x={winX + winW / 2} y={winY - 18} textAnchor="middle" fontSize={11} fontWeight={600}>
        {win.width}mm
      </text>

      <line x1={railX} y1={railY - 18} x2={railX + railW} y2={railY - 18} stroke="#D1D5DB" strokeWidth={0.5} strokeDasharray="3,2" />
      <text x={railX + railW / 2} y={railY - 22} textAnchor="middle" fontSize={9} fill="#9CA3AF">
        레일 {win.width + 300}mm
      </text>

      <line x1={winX + winW + 16} y1={winY} x2={winX + winW + 16} y2={winY + winH} stroke="#9CA3AF" strokeWidth={0.8} />
      <text x={winX + winW + 20} y={winY + winH / 2 + 4} fontSize={11} fontWeight={600}>
        {win.height}mm
      </text>

      <line x1={winX - 16} y1={winY + winH} x2={winX - 16} y2={winY + winH + sillH} stroke="#D1D5DB" strokeWidth={0.5} strokeDasharray="3,2" />
      <text x={winX - 20} y={winY + winH + sillH / 2 + 4} textAnchor="end" fontSize={9} fill="#9CA3AF">
        {win.sillHeight}mm
      </text>

      <defs>
        <marker id="arrow" viewBox="0 0 6 6" refX={6} refY={3} markerWidth={6} markerHeight={6} orient="auto">
          <path d="M0,0 L6,3 L0,6" fill="#9CA3AF" />
        </marker>
        <marker id="arrow-start" viewBox="0 0 6 6" refX={0} refY={3} markerWidth={6} markerHeight={6} orient="auto">
          <path d="M6,0 L0,3 L6,6" fill="#9CA3AF" />
        </marker>
      </defs>
    </g>
  );
}

export function CurtainPreview() {
  return (
    <div className="w-full h-full flex items-center justify-center bg-slate-50 rounded-lg border">
      <CurtainSvg />
    </div>
  );
}
