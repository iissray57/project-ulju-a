'use server';

import { createClient } from '@/lib/supabase/server';
import type { Database, TablesInsert, TablesUpdate } from '@/lib/database.types';
import { orderMaterialSchema, type OrderMaterialFormData } from '@/lib/schemas/order-material';
import { revalidatePath } from 'next/cache';
import type { ChecklistItem } from '@/lib/schemas/checklist';
import { DEFAULT_PREPARATION_CHECKLIST } from '@/lib/schemas/checklist';

type OrderMaterialRow = Database['public']['Tables']['order_materials']['Row'];
type OrderMaterialInsert = TablesInsert<'order_materials'>;
type OrderMaterialUpdate = TablesUpdate<'order_materials'>;

// 공통 결과 타입
export interface ActionResult<T = unknown> {
  data?: T;
  error?: string;
}

// 주문별 자재 목록 (product join)
export interface OrderMaterialWithProduct extends OrderMaterialRow {
  product: {
    id: string;
    name: string;
    category: string;
    sku: string | null;
    unit: string | null;
  } | null;
}

// 주문 자재 요약 타입
export interface OrderMaterialSummary {
  total_planned: number;
  total_held: number;
  total_shortage: number;
  items: OrderMaterialWithProduct[];
}

/**
 * 주문별 자재 목록 조회 (product join)
 */
export async function getOrderMaterials(
  orderId: string
): Promise<ActionResult<OrderMaterialWithProduct[]>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: '인증이 필요합니다.' };
    }

    const { data, error } = await supabase
      .from('order_materials')
      .select(
        `
        *,
        product:products(id, name, category, sku, unit)
      `
      )
      .eq('order_id', orderId)
      .eq('user_id', user.id);

    if (error) {
      console.error('[getOrderMaterials] Supabase error:', error);
      return { error: error.message };
    }

    return { data: data as OrderMaterialWithProduct[] };
  } catch (err) {
    console.error('[getOrderMaterials] Unexpected error:', err);
    return { error: '자재 목록 조회 중 오류가 발생했습니다.' };
  }
}

/**
 * 자재 추가
 */
export async function addOrderMaterial(
  formData: OrderMaterialFormData
): Promise<ActionResult<OrderMaterialRow>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: '인증이 필요합니다.' };
    }

    // 입력 검증
    const parsed = orderMaterialSchema.safeParse(formData);
    if (!parsed.success) {
      return { error: '입력 값이 유효하지 않습니다.' };
    }

    // INSERT
    const insertData: OrderMaterialInsert = {
      user_id: user.id,
      order_id: parsed.data.order_id,
      product_id: parsed.data.product_id,
      planned_quantity: parsed.data.planned_quantity,
      memo: parsed.data.memo ?? null,
      used_quantity: 0,
      held_quantity: 0,
      shortage_quantity: 0,
    };

    const { data, error } = await supabase
      .from('order_materials')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('[addOrderMaterial] Insert error:', error);
      return { error: error.message };
    }

    // 품목명 조회 → 체크리스트에 자동 추가
    const { data: product } = await supabase
      .from('products')
      .select('name')
      .eq('id', parsed.data.product_id)
      .single();

    if (product) {
      await addMaterialToChecklist(supabase, parsed.data.order_id, parsed.data.product_id, product.name);
    }

    revalidatePath('/orders');
    revalidatePath(`/orders/${parsed.data.order_id}`);
    return { data };
  } catch (err) {
    console.error('[addOrderMaterial] Unexpected error:', err);
    return { error: '자재 추가 중 오류가 발생했습니다.' };
  }
}

/**
 * 자재 수량 수정
 */
export async function updateOrderMaterial(
  id: string,
  data: { planned_quantity?: number; memo?: string }
): Promise<ActionResult<OrderMaterialRow>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: '인증이 필요합니다.' };
    }

    // 현재 자재 정보 조회 (order_id 확인용)
    const { data: material, error: fetchError } = await supabase
      .from('order_materials')
      .select('order_id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !material) {
      console.error('[updateOrderMaterial] Fetch error:', fetchError);
      return { error: '자재를 찾을 수 없습니다.' };
    }

    // UPDATE
    const updateData: OrderMaterialUpdate = {
      ...(data.planned_quantity !== undefined && {
        planned_quantity: data.planned_quantity,
      }),
      ...(data.memo !== undefined && { memo: data.memo ?? null }),
    };

    const { data: updated, error: updateError } = await supabase
      .from('order_materials')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (updateError) {
      console.error('[updateOrderMaterial] Update error:', updateError);
      return { error: updateError.message };
    }

    if (!updated) {
      return { error: '자재를 찾을 수 없습니다.' };
    }

    revalidatePath('/orders');
    revalidatePath(`/orders/${material.order_id}`);
    return { data: updated };
  } catch (err) {
    console.error('[updateOrderMaterial] Unexpected error:', err);
    return { error: '자재 수정 중 오류가 발생했습니다.' };
  }
}

/**
 * 자재 제거
 */
export async function removeOrderMaterial(id: string): Promise<ActionResult<void>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: '인증이 필요합니다.' };
    }

    // 현재 자재 정보 조회 (order_id + product_id 확인용)
    const { data: material, error: fetchError } = await supabase
      .from('order_materials')
      .select('order_id, product_id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !material) {
      console.error('[removeOrderMaterial] Fetch error:', fetchError);
      return { error: '자재를 찾을 수 없습니다.' };
    }

    // DELETE
    const { error: deleteError } = await supabase
      .from('order_materials')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (deleteError) {
      console.error('[removeOrderMaterial] Delete error:', deleteError);
      return { error: deleteError.message };
    }

    // 체크리스트에서 해당 자재 항목 제거
    if (material.product_id) {
      await removeMaterialFromChecklist(supabase, material.order_id, material.product_id);
    }

    revalidatePath('/orders');
    revalidatePath(`/orders/${material.order_id}`);
    return { data: undefined };
  } catch (err) {
    console.error('[removeOrderMaterial] Unexpected error:', err);
    return { error: '자재 제거 중 오류가 발생했습니다.' };
  }
}

/**
 * 주문의 자재 요약 (총 계획/hold/shortage)
 */
export async function getOrderMaterialSummary(
  orderId: string
): Promise<ActionResult<OrderMaterialSummary>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: '인증이 필요합니다.' };
    }

    const { data, error } = await supabase
      .from('order_materials')
      .select(
        `
        *,
        product:products(id, name, category, sku, unit)
      `
      )
      .eq('order_id', orderId)
      .eq('user_id', user.id);

    if (error) {
      console.error('[getOrderMaterialSummary] Supabase error:', error);
      return { error: error.message };
    }

    const items = data as OrderMaterialWithProduct[];

    // 집계
    const total_planned = items.reduce((sum, item) => sum + item.planned_quantity, 0);
    const total_held = items.reduce((sum, item) => sum + item.held_quantity, 0);
    const total_shortage = items.reduce((sum, item) => sum + item.shortage_quantity, 0);

    return {
      data: {
        total_planned,
        total_held,
        total_shortage,
        items,
      },
    };
  } catch (err) {
    console.error('[getOrderMaterialSummary] Unexpected error:', err);
    return { error: '자재 요약 조회 중 오류가 발생했습니다.' };
  }
}

// ── 체크리스트 연동 헬퍼 ─────────────────────────────────────

function materialChecklistId(productId: string) {
  return `mat-${productId}`;
}

async function addMaterialToChecklist(
  supabase: Awaited<ReturnType<typeof createClient>>,
  orderId: string,
  productId: string,
  productName: string
) {
  try {
    const { data: order } = await supabase
      .from('orders')
      .select('preparation_checklist')
      .eq('id', orderId)
      .single();

    const existing = (order?.preparation_checklist as ChecklistItem[] | null) ?? [...DEFAULT_PREPARATION_CHECKLIST];
    const newId = materialChecklistId(productId);

    // 이미 존재하면 스킵
    if (existing.some((item) => item.id === newId)) return;

    const newItem: ChecklistItem = {
      id: newId,
      label: `${productName} 자재 확보`,
      checked: false,
    };

    await supabase
      .from('orders')
      .update({ preparation_checklist: [...existing, newItem] })
      .eq('id', orderId);
  } catch (err) {
    console.error('[addMaterialToChecklist] Error:', err);
  }
}

async function removeMaterialFromChecklist(
  supabase: Awaited<ReturnType<typeof createClient>>,
  orderId: string,
  productId: string
) {
  try {
    const { data: order } = await supabase
      .from('orders')
      .select('preparation_checklist')
      .eq('id', orderId)
      .single();

    const existing = (order?.preparation_checklist as ChecklistItem[] | null) ?? [...DEFAULT_PREPARATION_CHECKLIST];
    const targetId = materialChecklistId(productId);
    const filtered = existing.filter((item) => item.id !== targetId);

    // 변경이 있을 때만 업데이트
    if (filtered.length !== existing.length) {
      await supabase
        .from('orders')
        .update({ preparation_checklist: filtered })
        .eq('id', orderId);
    }
  } catch (err) {
    console.error('[removeMaterialFromChecklist] Error:', err);
  }
}
