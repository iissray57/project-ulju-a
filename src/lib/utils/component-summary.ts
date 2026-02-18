import type { FurnitureCategory } from '@/lib/types/closet-editor';
import type { ModelData } from '@/app/(dashboard)/closet/model-actions';

export const CATEGORY_LABEL: Record<FurnitureCategory, string> = {
  wardrobe: '옷장',
  drawer_cabinet: '서랍장',
  bedding_cabinet: '이불장',
  mirror_cabinet: '거울장',
};

const PRESET_TYPE_LABEL: Record<string, string> = {
  A: 'A타입', B: 'B타입', C: 'C타입', D: 'D타입', E: 'E타입', F: 'F타입',
};

/** model_data.components에서 가구 구성 요약 추출 (카테고리별 그룹화) */
export function extractComponentSummary(
  modelData: ModelData
): Array<{ category: string; presetType: string | null; width: number; count: number; cornerType: string | null }> {
  type SummaryKey = string;
  const groups = new Map<SummaryKey, {
    category: string;
    presetType: string | null;
    width: number;
    count: number;
    cornerType: string | null;
  }>();

  for (const comp of modelData.components) {
    // Use furnitureCategory if available, fall back to presetType-based label
    let category: string;
    if (comp.furnitureCategory) {
      category = CATEGORY_LABEL[comp.furnitureCategory] ?? comp.furnitureCategory;
    } else if (comp.presetType) {
      category = '옷장'; // All A-F presets are wardrobe types
    } else {
      continue; // Skip components without category or preset
    }

    const presetType = comp.presetType ?? null;
    const width = comp.dimensions.width;
    const cornerType = comp.cornerType ?? null;
    const key: SummaryKey = `${category}|${presetType}|${width}|${cornerType}`;

    const existing = groups.get(key);
    if (existing) {
      existing.count += 1;
    } else {
      groups.set(key, { category, presetType, width, count: 1, cornerType });
    }
  }

  return Array.from(groups.values());
}

export { PRESET_TYPE_LABEL };
