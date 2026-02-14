'use server';

import { createClient } from '@/lib/supabase/server';
import type { ClosetComponent } from '@/lib/types/closet-editor';

// ── Model Data Types ────────────────────────────────────────

export interface ModelData {
  components: ClosetComponent[];
  gridSize: number;
  version: number; // 스키마 버전
}

export interface ActionResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// ── Save Model ──────────────────────────────────────────────

export async function saveClosetModel(
  orderId: string,
  modelData: ModelData
): Promise<ActionResult<void>> {
  try {
    const supabase = await createClient();

    // Auth check
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { success: false, error: '인증이 필요합니다.' };
    }

    // Update orders.model_scene_data
    const { error: updateError } = await supabase
      .from('orders')
      .update({ model_scene_data: modelData as any })
      .eq('id', orderId)
      .eq('user_id', user.id);

    if (updateError) {
      console.error('saveClosetModel error:', updateError);
      return { success: false, error: '모델 저장 실패: ' + updateError.message };
    }

    return { success: true };
  } catch (err) {
    console.error('saveClosetModel unexpected error:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.'
    };
  }
}

// ── Load Model ──────────────────────────────────────────────

export async function loadClosetModel(
  orderId: string
): Promise<ActionResult<ModelData | null>> {
  try {
    const supabase = await createClient();

    // Auth check
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { success: false, error: '인증이 필요합니다.' };
    }

    // Fetch orders.model_scene_data
    const { data, error: fetchError } = await supabase
      .from('orders')
      .select('model_scene_data')
      .eq('id', orderId)
      .eq('user_id', user.id)
      .single();

    if (fetchError) {
      console.error('loadClosetModel error:', fetchError);
      return { success: false, error: '모델 불러오기 실패: ' + fetchError.message };
    }

    if (!data?.model_scene_data) {
      return { success: true, data: null };
    }

    // Validate structure
    const modelData = data.model_scene_data as any;
    if (
      typeof modelData !== 'object' ||
      !Array.isArray(modelData.components) ||
      typeof modelData.gridSize !== 'number' ||
      typeof modelData.version !== 'number'
    ) {
      return { success: false, error: '모델 데이터 형식이 올바르지 않습니다.' };
    }

    return { success: true, data: modelData as ModelData };
  } catch (err) {
    console.error('loadClosetModel unexpected error:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.'
    };
  }
}
