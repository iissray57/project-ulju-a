'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

// 공통 결과 타입
export interface ActionResult<T = unknown> {
  data?: T;
  error?: string;
}

// 입고 처리 아이템 타입
export interface ReceiveItem {
  product_id: string;
  quantity: number;
}

// 재할당 알림 타입
export interface ReallocationAlert {
  order_id: string;
  order_number: string;
  product_id: string;
  product_name: string;
  shortage_quantity: number;
}

/**
 * 입고 처리 (전체 또는 부분)
 * items가 null이면 전체 입고, 배열이면 부분 입고
 */
export async function receivePurchaseOrder(
  poId: string,
  items?: ReceiveItem[]
): Promise<ActionResult<{ received_items: ReceiveItem[] }>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: '인증이 필요합니다.' };
    }

    // RPC 호출
    const { data, error } = await supabase.rpc('receive_purchase_order', {
      p_purchase_order_id: poId,
      p_items: items ? JSON.parse(JSON.stringify(items)) : null,
    });

    if (error) {
      console.error('[receivePurchaseOrder] RPC error:', error);
      return { error: error.message };
    }

    // RPC 결과 파싱
    const result = data as { success: boolean; error?: string; received_items?: ReceiveItem[] };

    if (!result.success) {
      return { error: result.error || '입고 처리에 실패했습니다.' };
    }

    revalidatePath('/purchases');
    revalidatePath(`/purchases/${poId}`);
    revalidatePath('/inventory');

    return { data: { received_items: result.received_items || [] } };
  } catch (err) {
    console.error('[receivePurchaseOrder] Unexpected error:', err);
    return { error: '입고 처리 중 오류가 발생했습니다.' };
  }
}

/**
 * 입고 완료 후 재할당 알림 조회
 * productIds에 해당하는 shortage_quantity > 0인 수주 목록 반환
 */
export async function getReallocationAlerts(
  productIds: string[]
): Promise<ActionResult<ReallocationAlert[]>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: '인증이 필요합니다.' };
    }

    if (productIds.length === 0) {
      return { data: [] };
    }

    // shortage_quantity > 0인 order_materials 조회
    const { data, error } = await supabase
      .from('order_materials')
      .select(
        `
        order_id,
        product_id,
        shortage_quantity,
        order:orders!inner(order_number),
        product:products!inner(name)
      `
      )
      .in('product_id', productIds)
      .gt('shortage_quantity', 0)
      .eq('user_id', user.id);

    if (error) {
      console.error('[getReallocationAlerts] Supabase error:', error);
      return { error: error.message };
    }

    // 결과 변환
    const alerts: ReallocationAlert[] = (data || []).map((item) => ({
      order_id: item.order_id,
      order_number: (Array.isArray(item.order) && item.order[0]?.order_number) || 'N/A',
      product_id: item.product_id,
      product_name: (Array.isArray(item.product) && item.product[0]?.name) || '알 수 없음',
      shortage_quantity: item.shortage_quantity,
    }));

    return { data: alerts };
  } catch (err) {
    console.error('[getReallocationAlerts] Unexpected error:', err);
    return { error: '재할당 알림 조회 중 오류가 발생했습니다.' };
  }
}
