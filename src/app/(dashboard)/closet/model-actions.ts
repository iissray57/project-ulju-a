'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type { ClosetComponent } from '@/lib/types/closet-editor';

// ── Types ────────────────────────────────────────────────────

export interface ModelData {
  components: ClosetComponent[];
  gridSize: number;
  version: number;
  /** Rack simulator items (version 2+) */
  rackItems?: unknown[];
}

export interface ClosetModelRow {
  id: string;
  user_id: string;
  order_id: string | null;
  name: string;
  model_data: ModelData;
  thumbnail_url: string | null;
  elevation_image_url: string | null;
  three_d_image_url: string | null;
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

/** 주문별 모델 썸네일 목록 (PDF용 - 이름+이미지URL 3종) */
export async function getModelThumbnails(
  orderId: string
): Promise<ActionResult<Array<{
  name: string;
  thumbnail_url: string | null;
  elevation_image_url: string | null;
  three_d_image_url: string | null;
}>>> {
  const auth = await getAuthedClient();
  if (!auth) return { success: false, error: '인증이 필요합니다.' };

  const { data, error } = await auth.supabase
    .from('closet_models')
    .select('name, thumbnail_url, elevation_image_url, three_d_image_url')
    .eq('order_id', orderId)
    .eq('user_id', auth.user.id)
    .order('created_at', { ascending: true });

  if (error) return { success: false, error: error.message };
  return { success: true, data: data ?? [] };
}

// ── Storage: 캡처 이미지 동기화 ─────────────────────────────

/** base64 캡처 이미지를 Storage에 업로드하고 closet_models 업데이트 */
export async function syncModelCaptures(params: {
  modelId: string;
  planImage: string;        // base64 data URL (data:image/png;base64,...)
  elevationImage: string;   // base64 data URL
  threeDImage?: string;     // optional base64 data URL
}): Promise<ActionResult<{ planUrl: string; elevationUrl: string; threeDUrl?: string }>> {
  const auth = await getAuthedClient();
  if (!auth) return { success: false, error: '인증이 필요합니다.' };

  const { supabase, user } = auth;
  const basePath = `${user.id}/captures`;

  const toBuffer = (dataUrl: string): Buffer =>
    Buffer.from(dataUrl.split(',')[1], 'base64');

  // plan 업로드
  const planPath = `${basePath}/${params.modelId}_plan.png`;
  const { error: planErr } = await supabase.storage
    .from('images')
    .upload(planPath, toBuffer(params.planImage), {
      contentType: 'image/png',
      upsert: true,
    });
  if (planErr) return { success: false, error: `plan 업로드 실패: ${planErr.message}` };

  // elevation 업로드
  const elevationPath = `${basePath}/${params.modelId}_elevation.png`;
  const { error: elevErr } = await supabase.storage
    .from('images')
    .upload(elevationPath, toBuffer(params.elevationImage), {
      contentType: 'image/png',
      upsert: true,
    });
  if (elevErr) return { success: false, error: `elevation 업로드 실패: ${elevErr.message}` };

  // 3D 업로드 (선택)
  let threeDPath: string | undefined;
  if (params.threeDImage) {
    threeDPath = `${basePath}/${params.modelId}_3d.png`;
    const { error: tdErr } = await supabase.storage
      .from('images')
      .upload(threeDPath, toBuffer(params.threeDImage), {
        contentType: 'image/png',
        upsert: true,
      });
    if (tdErr) return { success: false, error: `3D 업로드 실패: ${tdErr.message}` };
  }

  // public URL 조회
  const { data: planUrlData } = supabase.storage.from('images').getPublicUrl(planPath);
  const { data: elevUrlData } = supabase.storage.from('images').getPublicUrl(elevationPath);
  const planUrl = planUrlData.publicUrl;
  const elevationUrl = elevUrlData.publicUrl;
  const threeDUrl = threeDPath
    ? supabase.storage.from('images').getPublicUrl(threeDPath).data.publicUrl
    : undefined;

  // closet_models 업데이트
  const updatePayload: Record<string, unknown> = {
    thumbnail_url: planUrl,
    elevation_image_url: elevationUrl,
    updated_at: new Date().toISOString(),
  };
  if (threeDUrl) updatePayload.three_d_image_url = threeDUrl;

  const { error: dbErr } = await supabase
    .from('closet_models')
    .update(updatePayload)
    .eq('id', params.modelId)
    .eq('user_id', user.id);

  if (dbErr) return { success: false, error: `DB 업데이트 실패: ${dbErr.message}` };

  revalidatePath('/closet');
  revalidatePath('/orders');
  return { success: true, data: { planUrl, elevationUrl, threeDUrl } };
}
