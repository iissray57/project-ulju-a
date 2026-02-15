'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type { ClosetComponent } from '@/lib/types/closet-editor';

// ── Types ────────────────────────────────────────────────────

export interface ModelData {
  components: ClosetComponent[];
  gridSize: number;
  version: number;
}

export interface ClosetModelRow {
  id: string;
  user_id: string;
  order_id: string | null;
  name: string;
  model_data: ModelData;
  thumbnail_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface ActionResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// ── Auth helper ──────────────────────────────────────────────

async function getAuthedClient() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;
  return { supabase, user };
}

// ── CRUD: closet_models 테이블 ───────────────────────────────

/** 주문별 모델 목록 조회 */
export async function getClosetModels(
  orderId: string
): Promise<ActionResult<ClosetModelRow[]>> {
  const auth = await getAuthedClient();
  if (!auth) return { success: false, error: '인증이 필요합니다.' };

  const { data, error } = await auth.supabase
    .from('closet_models')
    .select('*')
    .eq('order_id', orderId)
    .eq('user_id', auth.user.id)
    .order('created_at', { ascending: false });

  if (error) return { success: false, error: error.message };
  return { success: true, data: (data ?? []) as ClosetModelRow[] };
}

/** 단건 조회 */
export async function getClosetModel(
  id: string
): Promise<ActionResult<ClosetModelRow>> {
  const auth = await getAuthedClient();
  if (!auth) return { success: false, error: '인증이 필요합니다.' };

  const { data, error } = await auth.supabase
    .from('closet_models')
    .select('*')
    .eq('id', id)
    .eq('user_id', auth.user.id)
    .single();

  if (error) return { success: false, error: error.message };
  return { success: true, data: data as ClosetModelRow };
}

/** 모델 생성 */
export async function createClosetModel(params: {
  orderId: string;
  name: string;
  modelData: ModelData;
  thumbnailUrl?: string | null;
}): Promise<ActionResult<ClosetModelRow>> {
  const auth = await getAuthedClient();
  if (!auth) return { success: false, error: '인증이 필요합니다.' };

  const { data, error } = await auth.supabase
    .from('closet_models')
    .insert({
      user_id: auth.user.id,
      order_id: params.orderId,
      name: params.name,
      model_data: params.modelData as unknown as Record<string, unknown>,
      thumbnail_url: params.thumbnailUrl ?? null,
    })
    .select()
    .single();

  if (error) return { success: false, error: error.message };
  revalidatePath('/closet');
  revalidatePath('/orders');
  return { success: true, data: data as ClosetModelRow };
}

/** 모델 수정 (데이터 + 썸네일) */
export async function updateClosetModel(params: {
  id: string;
  name?: string;
  modelData?: ModelData;
  thumbnailUrl?: string | null;
}): Promise<ActionResult<ClosetModelRow>> {
  const auth = await getAuthedClient();
  if (!auth) return { success: false, error: '인증이 필요합니다.' };

  const payload: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (params.name !== undefined) payload.name = params.name;
  if (params.modelData !== undefined) payload.model_data = params.modelData;
  if (params.thumbnailUrl !== undefined) payload.thumbnail_url = params.thumbnailUrl;

  const { data, error } = await auth.supabase
    .from('closet_models')
    .update(payload)
    .eq('id', params.id)
    .eq('user_id', auth.user.id)
    .select()
    .single();

  if (error) return { success: false, error: error.message };
  revalidatePath('/closet');
  revalidatePath('/orders');
  return { success: true, data: data as ClosetModelRow };
}

/** 모델 삭제 */
export async function deleteClosetModel(id: string): Promise<ActionResult<void>> {
  const auth = await getAuthedClient();
  if (!auth) return { success: false, error: '인증이 필요합니다.' };

  const { error } = await auth.supabase
    .from('closet_models')
    .delete()
    .eq('id', id)
    .eq('user_id', auth.user.id);

  if (error) return { success: false, error: error.message };
  revalidatePath('/closet');
  revalidatePath('/orders');
  return { success: true };
}

// ── Legacy: orders.model_scene_data 호환 ────────────────────

/** 주문의 model_scene_data JSONB에 저장 (에디터용) */
export async function saveClosetModel(
  orderId: string,
  modelData: ModelData
): Promise<ActionResult<void>> {
  const auth = await getAuthedClient();
  if (!auth) return { success: false, error: '인증이 필요합니다.' };

  const { error } = await auth.supabase
    .from('orders')
    .update({ model_scene_data: modelData as any })
    .eq('id', orderId)
    .eq('user_id', auth.user.id);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

/** 주문의 model_scene_data JSONB에서 로드 (에디터용) */
export async function loadClosetModel(
  orderId: string
): Promise<ActionResult<ModelData | null>> {
  const auth = await getAuthedClient();
  if (!auth) return { success: false, error: '인증이 필요합니다.' };

  const { data, error } = await auth.supabase
    .from('orders')
    .select('model_scene_data')
    .eq('id', orderId)
    .eq('user_id', auth.user.id)
    .single();

  if (error) return { success: false, error: error.message };
  if (!data?.model_scene_data) return { success: true, data: null };

  const md = data.model_scene_data as any;
  if (typeof md !== 'object' || !Array.isArray(md.components)) {
    return { success: false, error: '모델 데이터 형식이 올바르지 않습니다.' };
  }
  return { success: true, data: md as ModelData };
}

/** 주문별 모델 썸네일 목록 (PDF용 - 이름+썸네일만) */
export async function getModelThumbnails(
  orderId: string
): Promise<ActionResult<Array<{ name: string; thumbnail_url: string | null }>>> {
  const auth = await getAuthedClient();
  if (!auth) return { success: false, error: '인증이 필요합니다.' };

  const { data, error } = await auth.supabase
    .from('closet_models')
    .select('name, thumbnail_url')
    .eq('order_id', orderId)
    .eq('user_id', auth.user.id)
    .order('created_at', { ascending: true });

  if (error) return { success: false, error: error.message };
  return { success: true, data: data ?? [] };
}
