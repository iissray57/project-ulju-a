'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import {
  closetPresetFormSchema,
  type ClosetPresetFormData,
} from '@/lib/schemas/closet-preset';

// 프리셋 타입 (DB 타입이 stale이므로 직접 정의)
export interface ClosetPreset {
  id: string;
  user_id: string | null;
  name: string;
  category: string;
  preset_data: Record<string, unknown>;
  thumbnail_url: string | null;
  is_system: boolean;
  created_at: string;
  updated_at: string;
}

// 공통 결과 타입
export interface ActionResult<T = unknown> {
  data?: T;
  error?: string;
  count?: number;
}

/**
 * 프리셋 목록 조회 (시스템 + 사용자)
 */
export async function getPresets(category?: string): Promise<ActionResult<ClosetPreset[]>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: '인증이 필요합니다.' };
    }

    let query = supabase
      .from('closet_component_presets')
      .select('*')
      .or(`user_id.eq.${user.id},is_system.eq.true`);

    if (category) {
      query = query.eq('category', category);
    }

    query = query.order('is_system', { ascending: false }).order('created_at', { ascending: false });

    const { data, error } = await query;

    if (error) {
      console.error('[getPresets] Supabase error:', error);
      return { error: error.message };
    }

    return { data: data || [] };
  } catch (err) {
    console.error('[getPresets] Unexpected error:', err);
    return { error: '프리셋 목록 조회 중 오류가 발생했습니다.' };
  }
}

/**
 * 단일 프리셋 조회
 */
export async function getPreset(id: string): Promise<ActionResult<ClosetPreset>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: '인증이 필요합니다.' };
    }

    const { data, error } = await supabase
      .from('closet_component_presets')
      .select('*')
      .eq('id', id)
      .or(`user_id.eq.${user.id},is_system.eq.true`)
      .single();

    if (error) {
      console.error('[getPreset] Supabase error:', error);
      return { error: error.message };
    }

    if (!data) {
      return { error: '프리셋을 찾을 수 없습니다.' };
    }

    return { data };
  } catch (err) {
    console.error('[getPreset] Unexpected error:', err);
    return { error: '프리셋 조회 중 오류가 발생했습니다.' };
  }
}

/**
 * 사용자 프리셋 생성
 */
export async function createPreset(
  formData: ClosetPresetFormData
): Promise<ActionResult<ClosetPreset>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: '인증이 필요합니다.' };
    }

    // 입력 검증
    const parsed = closetPresetFormSchema.safeParse(formData);
    if (!parsed.success) {
      return { error: '입력 값이 유효하지 않습니다.' };
    }

    // INSERT
    const insertData = {
      user_id: user.id,
      name: parsed.data.name,
      category: parsed.data.category,
      preset_data: parsed.data.preset_data as unknown as Record<string, unknown>,
      is_system: false,
    };

    const { data, error } = await supabase
      .from('closet_component_presets')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('[createPreset] Insert error:', error);
      return { error: error.message };
    }

    revalidatePath('/closet/presets');
    return { data };
  } catch (err) {
    console.error('[createPreset] Unexpected error:', err);
    return { error: '프리셋 생성 중 오류가 발생했습니다.' };
  }
}

/**
 * 사용자 프리셋 수정
 */
export async function updatePreset(
  id: string,
  formData: Partial<ClosetPresetFormData>
): Promise<ActionResult<ClosetPreset>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: '인증이 필요합니다.' };
    }

    // 기존 프리셋 확인
    const { data: existing, error: fetchError } = await supabase
      .from('closet_component_presets')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !existing) {
      console.error('[updatePreset] Fetch error:', fetchError);
      return { error: '프리셋을 찾을 수 없습니다.' };
    }

    // 시스템 프리셋은 수정 불가
    if (existing.is_system) {
      return { error: '시스템 프리셋은 수정할 수 없습니다.' };
    }

    // 부분 입력 검증
    const parsed = closetPresetFormSchema.partial().safeParse(formData);
    if (!parsed.success) {
      return { error: '입력 값이 유효하지 않습니다.' };
    }

    // UPDATE
    const updateData = {
      ...(parsed.data.name !== undefined && { name: parsed.data.name }),
      ...(parsed.data.category !== undefined && { category: parsed.data.category }),
      ...(parsed.data.preset_data !== undefined && {
        preset_data: parsed.data.preset_data as unknown as Record<string, unknown>
      }),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('closet_component_presets')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      console.error('[updatePreset] Update error:', error);
      return { error: error.message };
    }

    if (!data) {
      return { error: '프리셋 수정에 실패했습니다.' };
    }

    revalidatePath('/closet/presets');
    return { data };
  } catch (err) {
    console.error('[updatePreset] Unexpected error:', err);
    return { error: '프리셋 수정 중 오류가 발생했습니다.' };
  }
}

/**
 * 사용자 프리셋 삭제 (시스템 프리셋은 삭제 불가)
 */
export async function deletePreset(id: string): Promise<ActionResult<void>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: '인증이 필요합니다.' };
    }

    // 기존 프리셋 확인
    const { data: existing, error: fetchError } = await supabase
      .from('closet_component_presets')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !existing) {
      console.error('[deletePreset] Fetch error:', fetchError);
      return { error: '프리셋을 찾을 수 없습니다.' };
    }

    // 시스템 프리셋은 삭제 불가
    if (existing.is_system) {
      return { error: '시스템 프리셋은 삭제할 수 없습니다.' };
    }

    // DELETE
    const { error: deleteError } = await supabase
      .from('closet_component_presets')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (deleteError) {
      console.error('[deletePreset] Delete error:', deleteError);
      return { error: deleteError.message };
    }

    revalidatePath('/closet/presets');
    return { data: undefined };
  } catch (err) {
    console.error('[deletePreset] Unexpected error:', err);
    return { error: '프리셋 삭제 중 오류가 발생했습니다.' };
  }
}
