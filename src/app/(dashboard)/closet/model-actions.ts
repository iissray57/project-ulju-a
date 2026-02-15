'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type { ClosetComponent } from '@/lib/types/closet-editor';
import { closetModelFormSchema, type ClosetModelFormData } from '@/lib/schemas/closet-model';

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

// ── closet_models 테이블 CRUD ───────────────────────────────

interface ClosetModelRow {
  id: string;
  user_id: string;
  order_id: string | null;
  name: string;
  model_data: unknown;
  thumbnail_url: string | null;
  created_at: string;
  updated_at: string;
}

// 1. 목록 조회 (order_id로 필터 가능)
export async function getClosetModels(
  orderId?: string
): Promise<ActionResult<ClosetModelRow[]>> {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: '인증이 필요합니다.' };
    }

    let query = supabase
      .from('closet_models')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (orderId) {
      query = query.eq('order_id', orderId);
    }

    const { data, error } = await query.returns<ClosetModelRow[]>();

    if (error) {
      console.error('getClosetModels error:', error);
      return { success: false, error: '모델 목록 조회 실패: ' + error.message };
    }

    return { success: true, data: data ?? [] };
  } catch (err) {
    console.error('getClosetModels unexpected error:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.'
    };
  }
}

// 2. 단건 조회
export async function getClosetModel(
  id: string
): Promise<ActionResult<ClosetModelRow>> {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: '인증이 필요합니다.' };
    }

    const { data, error } = await supabase
      .from('closet_models')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single<ClosetModelRow>();

    if (error) {
      console.error('getClosetModel error:', error);
      return { success: false, error: '모델 조회 실패: ' + error.message };
    }

    return { success: true, data };
  } catch (err) {
    console.error('getClosetModel unexpected error:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.'
    };
  }
}

// 3. 생성
export async function createClosetModel(
  formData: ClosetModelFormData
): Promise<ActionResult<ClosetModelRow>> {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: '인증이 필요합니다.' };
    }

    // 입력 검증
    const parsed = closetModelFormSchema.safeParse(formData);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }

    const { data, error } = await supabase
      .from('closet_models')
      .insert({
        user_id: user.id,
        order_id: parsed.data.order_id ?? null,
        name: parsed.data.name,
        model_data: parsed.data.model_data,
        thumbnail_url: parsed.data.thumbnail_url ?? null,
      })
      .select()
      .single<ClosetModelRow>();

    if (error) {
      console.error('createClosetModel error:', error);
      return { success: false, error: '모델 생성 실패: ' + error.message };
    }

    revalidatePath('/closet');
    return { success: true, data };
  } catch (err) {
    console.error('createClosetModel unexpected error:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.'
    };
  }
}

// 4. 수정
export async function updateClosetModel(
  id: string,
  formData: Partial<ClosetModelFormData>
): Promise<ActionResult<ClosetModelRow>> {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: '인증이 필요합니다.' };
    }

    // 부분 검증
    const parsed = closetModelFormSchema.partial().safeParse(formData);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }

    const updatePayload: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (parsed.data.order_id !== undefined) updatePayload.order_id = parsed.data.order_id;
    if (parsed.data.name !== undefined) updatePayload.name = parsed.data.name;
    if (parsed.data.model_data !== undefined) updatePayload.model_data = parsed.data.model_data;
    if (parsed.data.thumbnail_url !== undefined) updatePayload.thumbnail_url = parsed.data.thumbnail_url;

    const { data, error } = await supabase
      .from('closet_models')
      .update(updatePayload)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single<ClosetModelRow>();

    if (error) {
      console.error('updateClosetModel error:', error);
      return { success: false, error: '모델 수정 실패: ' + error.message };
    }

    revalidatePath('/closet');
    return { success: true, data };
  } catch (err) {
    console.error('updateClosetModel unexpected error:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.'
    };
  }
}

// 5. 삭제
export async function deleteClosetModel(
  id: string
): Promise<ActionResult<void>> {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: '인증이 필요합니다.' };
    }

    const { error } = await supabase
      .from('closet_models')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('deleteClosetModel error:', error);
      return { success: false, error: '모델 삭제 실패: ' + error.message };
    }

    revalidatePath('/closet');
    return { success: true };
  } catch (err) {
    console.error('deleteClosetModel unexpected error:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.'
    };
  }
}
