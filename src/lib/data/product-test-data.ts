/**
 * 품목 테스트 데이터
 * 기준: docs/product-catalog-analysis.md
 *
 * 앵글 시스템 (드레스룸):
 * - 10cm 단위
 * - 깊이: 300~600mm
 * - 가로: 300~1500mm
 * - 합판 원장: 1200 x 2400mm
 */

import type { ProductFormData, ProductCategory } from '@/lib/schemas/product';

// 규격 배열
export const ANGLE_DEPTHS = [300, 400, 500, 600] as const; // 10cm 단위
export const ANGLE_WIDTHS = [300, 400, 500, 600, 700, 800, 900, 1000, 1100, 1200, 1300, 1400, 1500] as const;
export const SYSTEM_WIDTHS = [300, 400, 450, 500, 600, 700, 800, 900] as const;

export const FRAME_COLORS = ['실버', '화이트', '골드', '블랙'] as const;
export const PANEL_COLORS = ['화이트오크', '메이플', '월넛', '화이트'] as const;
export const DRAWER_COLORS = ['화이트', '웜그레이', '오크'] as const;

// 합판 원장 사이즈
export const PLYWOOD_SIZE = { width: 1200, height: 2400 };

// 헬퍼 함수: SKU 생성
const sku = (prefix: string, ...parts: (string | number)[]) =>
  `${prefix}-${parts.join('-')}`;

// 색상 코드 맵
const colorCode: Record<string, string> = {
  '실버': 'SV', '화이트': 'WH', '골드': 'GD', '블랙': 'BK',
  '화이트오크': 'WO', '메이플': 'MP', '월넛': 'WN',
  '웜그레이': 'WG', '오크': 'OK',
};

// 품목 생성 헬퍼
interface ProductInput {
  name: string;
  category: ProductCategory;
  sku: string;
  width?: number;
  depth?: number;
  height?: number;
  color?: string;
  memo?: string;
}

const product = (input: ProductInput): ProductFormData => ({
  name: input.name,
  category: input.category,
  sku: input.sku,
  unit: 'EA',
  unit_price: 0,
  min_stock: 3,
  width: input.width ?? null,
  depth: input.depth ?? null,
  height: input.height ?? null,
  color: input.color ?? null,
  memo: input.memo ?? null,
  is_active: true,
});

// =============================================
// 1. 앵글 프레임 (드레스룸)
// 색상 x 깊이 x 가로 = 4 x 4 x 13 = 208종
// =============================================
export const angleFrameProducts: ProductFormData[] = FRAME_COLORS.flatMap(color =>
  ANGLE_DEPTHS.flatMap(depth =>
    ANGLE_WIDTHS.map(width =>
      product({
        name: `앵글프레임 ${color} ${width}x${depth}`,
        category: 'angle_frame',
        sku: sku('AF', colorCode[color], width, depth),
        width,
        depth,
        color,
        memo: '드레스룸용 앵글 프레임',
      })
    )
  )
);

// =============================================
// 2. 시스템 프레임 (시스템장) - 깊이 400 고정
// 색상 x 가로 = 4 x 8 = 32종
// =============================================
export const systemFrameProducts: ProductFormData[] = FRAME_COLORS.flatMap(color =>
  SYSTEM_WIDTHS.map(width =>
    product({
      name: `시스템프레임 ${color} ${width}x400`,
      category: 'system_frame',
      sku: sku('SF', colorCode[color], width),
      width,
      depth: 400,
      color,
      memo: '시스템장용 프레임, 깊이 400mm 고정',
    })
  )
);

// =============================================
// 3. 상판 - 깊이 400 고정
// 색상 x 가로 = 4 x 8 = 32종
// =============================================
export const topPanelProducts: ProductFormData[] = PANEL_COLORS.flatMap(color =>
  SYSTEM_WIDTHS.map(width =>
    product({
      name: `상판 ${color} ${width}x400`,
      category: 'top_panel',
      sku: sku('TP', colorCode[color], width),
      width,
      depth: 400,
      color,
      memo: '상판, 깊이 400mm 고정',
    })
  )
);

// =============================================
// 4. 선반 - 깊이 400 고정
// 색상 x 가로 = 4 x 8 = 32종
// =============================================
export const shelfProducts: ProductFormData[] = PANEL_COLORS.flatMap(color =>
  SYSTEM_WIDTHS.map(width =>
    product({
      name: `선반 ${color} ${width}x400`,
      category: 'shelf',
      sku: sku('SH', colorCode[color], width),
      width,
      depth: 400,
      color,
      memo: '선반, 깊이 400mm 고정',
    })
  )
);

// =============================================
// 5. 서랍장 (3단~5단, 색상별)
// 타입 x 색상 = 4 x 3 = 12종
// =============================================
export const drawerProducts: ProductFormData[] = DRAWER_COLORS.flatMap(color => [
  product({
    name: `미니서랍장 3단 ${color}`,
    category: 'drawer',
    sku: sku('DR', '3M', colorCode[color]),
    width: 600,
    color,
    memo: '소품/액세서리용',
  }),
  product({
    name: `서랍장 4단 ${color}`,
    category: 'drawer',
    sku: sku('DR', '4D', colorCode[color]),
    width: 800,
    color,
    memo: '속옷/양말용',
  }),
  product({
    name: `서랍장 5단 ${color}`,
    category: 'drawer',
    sku: sku('DR', '5D', colorCode[color]),
    width: 800,
    color,
    memo: '일반의류용',
  }),
  product({
    name: `와이드서랍장 4단 ${color}`,
    category: 'drawer',
    sku: sku('DR', '4W', colorCode[color]),
    width: 1000,
    color,
    memo: '넓은 수납용',
  }),
]);

// =============================================
// 6. 거울/거울장
// =============================================
export const mirrorProducts: ProductFormData[] = [
  product({ name: '거울장 400', category: 'mirror', sku: 'MR-400', width: 400, memo: '전신거울장' }),
  product({ name: '거울장 500', category: 'mirror', sku: 'MR-500', width: 500, memo: '전신거울장' }),
  product({ name: '반신거울', category: 'mirror', sku: 'MR-HALF', memo: '반신거울' }),
];

// =============================================
// 7. 행거봉 (너비별)
// =============================================
export const hangerBarProducts: ProductFormData[] = SYSTEM_WIDTHS.map(width =>
  product({
    name: `행거봉 ${width}`,
    category: 'hanger_bar',
    sku: sku('HB', width),
    width,
    memo: `너비 ${width}mm`,
  })
);

// =============================================
// 8. 조명 (LED 바)
// =============================================
export const lightingProducts: ProductFormData[] = [
  product({ name: 'LED 바 조명 600', category: 'lighting', sku: 'LED-600', width: 600 }),
  product({ name: 'LED 바 조명 900', category: 'lighting', sku: 'LED-900', width: 900 }),
  product({ name: 'LED 바 조명 1200', category: 'lighting', sku: 'LED-1200', width: 1200 }),
];

// =============================================
// 9. 트레이/칸막이
// =============================================
export const trayProducts: ProductFormData[] = [
  product({ name: '칸막이 트레이 소', category: 'tray', sku: 'TR-S', memo: '서랍 내부 정리용 소형' }),
  product({ name: '칸막이 트레이 중', category: 'tray', sku: 'TR-M', memo: '서랍 내부 정리용 중형' }),
  product({ name: '칸막이 트레이 대', category: 'tray', sku: 'TR-L', memo: '서랍 내부 정리용 대형' }),
];

// =============================================
// 10. 액세서리
// =============================================
export const accessoryProducts: ProductFormData[] = [
  product({ name: '바지걸이 슬라이딩', category: 'accessory', sku: 'ACC-PANTS', memo: '슬라이딩 타입' }),
  product({ name: '넥타이걸이', category: 'accessory', sku: 'ACC-TIE', memo: '넥타이/벨트 정리용' }),
  product({ name: '벨트걸이', category: 'accessory', sku: 'ACC-BELT', memo: '벨트 전용' }),
  product({ name: '가방걸이', category: 'accessory', sku: 'ACC-BAG', memo: '가방 수납용' }),
];

// =============================================
// 11. 하드웨어
// =============================================
export const hardwareProducts: ProductFormData[] = [
  product({ name: '경첩 세트', category: 'hardware', sku: 'HW-HINGE', memo: '문짝용' }),
  product({ name: '손잡이', category: 'hardware', sku: 'HW-HANDLE', memo: '서랍/문짝용' }),
  product({ name: '레일 세트', category: 'hardware', sku: 'HW-RAIL', memo: '서랍 레일' }),
];

// =============================================
// 전체 테스트 데이터
// =============================================
export const allTestProducts: ProductFormData[] = [
  ...angleFrameProducts,      // 208
  ...systemFrameProducts,     // 32
  ...topPanelProducts,        // 32
  ...shelfProducts,           // 32
  ...drawerProducts,          // 12
  ...mirrorProducts,          // 3
  ...hangerBarProducts,       // 8
  ...lightingProducts,        // 3
  ...trayProducts,            // 3
  ...accessoryProducts,       // 4
  ...hardwareProducts,        // 3
];

// 카테고리별 개수
export const productCountByCategory = {
  angle_frame: angleFrameProducts.length,      // 208
  system_frame: systemFrameProducts.length,    // 32
  top_panel: topPanelProducts.length,          // 32
  shelf: shelfProducts.length,                 // 32
  drawer: drawerProducts.length,               // 12
  mirror: mirrorProducts.length,               // 3
  hanger_bar: hangerBarProducts.length,        // 8
  lighting: lightingProducts.length,           // 3
  tray: trayProducts.length,                   // 3
  accessory: accessoryProducts.length,         // 4
  hardware: hardwareProducts.length,           // 3
  total: 340,
};
