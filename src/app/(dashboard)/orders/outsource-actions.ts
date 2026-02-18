'use server';

import { createClient } from '@/lib/supabase/server';
import type { Database, TablesInsert, TablesUpdate } from '@/lib/database.types';
import { revalidatePath } from 'next/cache';

type OutsourceOrderRow = Database['public']['Tables']['outsource_orders']['Row'];
type OutsourceOrderInsert = TablesInsert<'outsource_orders'>;
type OutsourceOrderUpdate = TablesUpdate<'outsource_orders'>;

export type OutsourceStatus = 'requested' | 'in_progress' | 'completed' | 'cancelled';
export type OutsourceType = 'system' | 'curtain';

export interface OutsourceOrderWithSupplier extends OutsourceOrderRow {
  supplier: {
    id: string;
    name: string;
    phone: string | null;
  } | null;
}

export interface ActionResult<T = unknown> {
  data?: T;
  error?: string;
}

export interface OutsourceOrderSummary {
  total: number;
  completed: number;
  totalAmount: number;
  allCompleted: boolean;
}

// 상태 전이 규칙
const OUTSOURCE_TRANSITIONS: Record<OutsourceStatus, OutsourceStatus[]> = {
  requested: ['in_progress', 'cancelled'],
  in_progress: ['completed', 'cancelled'],
  completed: [],
  cancelled: [],
};

function canTransitionOutsource(from: OutsourceStatus, to: OutsourceStatus): boolean {
  return OUTSOURCE_TRANSITIONS[from]?.includes(to) ?? false;
}

/**
 * 주문별 외주 발주 목록 조회 (supplier join)
 */
export async function getOutsourceOrders(
  orderId: string
): Promise<ActionResult<OutsourceOrderWithSupplier[]>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: '인증이 필요합니다.' };
    }

    const { data, error } = await supabase
      .from('outsource_orders')
      .select(
        `
        *,
        supplier:suppliers(id, name, phone)
      `
      )
      .eq('order_id', orderId)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[getOutsourceOrders] Supabase error:', error);
      return { error: error.message };
    }

    return { data: data as OutsourceOrderWithSupplier[] };
  } catch (err) {
    console.error('[getOutsourceOrders] Unexpected error:', err);
    return { error: '외주 발주 목록 조회 중 오류가 발생했습니다.' };
  }
}

/**
 * 외주 발주 단건 조회
 */
export async function getOutsourceOrder(
  id: string
): Promise<ActionResult<OutsourceOrderWithSupplier>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: '인증이 필요합니다.' };
    }

    const { data, error } = await supabase
      .from('outsource_orders')
      .select(
        `
        *,
        supplier:suppliers(id, name, phone)
      `
      )
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (error) {
      console.error('[getOutsourceOrder] Supabase error:', error);
      return { error: error.message };
    }

    if (!data) {
      return { error: '외주 발주를 찾을 수 없습니다.' };
    }

    return { data: data as OutsourceOrderWithSupplier };
  } catch (err) {
    console.error('[getOutsourceOrder] Unexpected error:', err);
    return { error: '외주 발주 조회 중 오류가 발생했습니다.' };
  }
}

export interface CreateOutsourceOrderData {
  order_id: string;
  outsource_type: OutsourceType;
  supplier_id: string;
  spec_summary?: string | null;
  memo?: string | null;
  plan_image_url?: string | null;
  elevation_image_url?: string | null;
  amount?: number;
  due_date?: string | null;
}

/**
 * 외주 발주 생성 (generate_outsource_number RPC 자동 채번)
 */
export async function createOutsourceOrder(
  formData: CreateOutsourceOrderData
): Promise<ActionResult<OutsourceOrderRow>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: '인증이 필요합니다.' };
    }

    if (!formData.order_id || !formData.outsource_type || !formData.supplier_id) {
      return { error: '필수 정보(주문, 외주 유형, 거래처)가 누락되었습니다.' };
    }

    // 자동 채번
    const { data: outsourceNumber, error: rpcError } = await supabase.rpc(
      'generate_outsource_number'
    );

    if (rpcError || !outsourceNumber) {
      console.error('[createOutsourceOrder] RPC error:', rpcError);
      return { error: '외주 발주번호 생성에 실패했습니다.' };
    }

    const insertData: OutsourceOrderInsert = {
      user_id: user.id,
      order_id: formData.order_id,
      outsource_number: outsourceNumber,
      outsource_type: formData.outsource_type,
      supplier_id: formData.supplier_id,
      status: 'requested',
      spec_summary: formData.spec_summary ?? null,
      memo: formData.memo ?? null,
      plan_image_url: formData.plan_image_url ?? null,
      elevation_image_url: formData.elevation_image_url ?? null,
      amount: formData.amount ?? 0,
      due_date: formData.due_date ?? null,
      requested_date: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('outsource_orders')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('[createOutsourceOrder] Insert error:', error);
      return { error: error.message };
    }

    revalidatePath('/orders');
    revalidatePath(`/orders/${formData.order_id}`);
    return { data };
  } catch (err) {
    console.error('[createOutsourceOrder] Unexpected error:', err);
    return { error: '외주 발주 생성 중 오류가 발생했습니다.' };
  }
}

export interface UpdateOutsourceOrderData {
  spec_summary?: string | null;
  memo?: string | null;
  plan_image_url?: string | null;
  elevation_image_url?: string | null;
  amount?: number;
  due_date?: string | null;
  supplier_id?: string;
}

/**
 * 외주 발주 수정
 */
export async function updateOutsourceOrder(
  id: string,
  formData: UpdateOutsourceOrderData
): Promise<ActionResult<OutsourceOrderRow>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: '인증이 필요합니다.' };
    }

    const updateData: OutsourceOrderUpdate = {
      ...(formData.spec_summary !== undefined && { spec_summary: formData.spec_summary }),
      ...(formData.memo !== undefined && { memo: formData.memo }),
      ...(formData.plan_image_url !== undefined && { plan_image_url: formData.plan_image_url }),
      ...(formData.elevation_image_url !== undefined && {
        elevation_image_url: formData.elevation_image_url,
      }),
      ...(formData.amount !== undefined && { amount: formData.amount }),
      ...(formData.due_date !== undefined && { due_date: formData.due_date }),
      ...(formData.supplier_id !== undefined && { supplier_id: formData.supplier_id }),
      updated_at: new Date().toISOString(),
    };

    // order_id 확인용 조회
    const { data: existing, error: fetchError } = await supabase
      .from('outsource_orders')
      .select('order_id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !existing) {
      console.error('[updateOutsourceOrder] Fetch error:', fetchError);
      return { error: '외주 발주를 찾을 수 없습니다.' };
    }

    const { data, error } = await supabase
      .from('outsource_orders')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      console.error('[updateOutsourceOrder] Update error:', error);
      return { error: error.message };
    }

    if (!data) {
      return { error: '외주 발주를 찾을 수 없습니다.' };
    }

    revalidatePath('/orders');
    revalidatePath(`/orders/${existing.order_id}`);
    return { data };
  } catch (err) {
    console.error('[updateOutsourceOrder] Unexpected error:', err);
    return { error: '외주 발주 수정 중 오류가 발생했습니다.' };
  }
}

/**
 * 외주 발주 상태 전이
 * - requested → in_progress, cancelled
 * - in_progress → completed, cancelled
 * - completed / cancelled → 불가
 * - completed 전이 시 completed_date 자동 기록
 */
export async function transitionOutsourceStatus(
  id: string,
  newStatus: OutsourceStatus
): Promise<ActionResult<OutsourceOrderRow>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: '인증이 필요합니다.' };
    }

    const { data: record, error: fetchError } = await supabase
      .from('outsource_orders')
      .select('status, order_id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !record) {
      console.error('[transitionOutsourceStatus] Fetch error:', fetchError);
      return { error: '외주 발주를 찾을 수 없습니다.' };
    }

    const currentStatus = record.status as OutsourceStatus;

    if (!canTransitionOutsource(currentStatus, newStatus)) {
      return {
        error: `${currentStatus} 상태에서 ${newStatus} 상태로 전이할 수 없습니다.`,
      };
    }

    const updateData: OutsourceOrderUpdate = {
      status: newStatus,
      updated_at: new Date().toISOString(),
      ...(newStatus === 'completed' && { completed_date: new Date().toISOString() }),
    };

    const { data, error } = await supabase
      .from('outsource_orders')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      console.error('[transitionOutsourceStatus] Update error:', error);
      return { error: error.message };
    }

    if (!data) {
      return { error: '외주 발주를 찾을 수 없습니다.' };
    }

    revalidatePath('/orders');
    revalidatePath(`/orders/${record.order_id}`);
    return { data };
  } catch (err) {
    console.error('[transitionOutsourceStatus] Unexpected error:', err);
    return { error: '외주 발주 상태 전이 중 오류가 발생했습니다.' };
  }
}

/**
 * 외주 발주 삭제 (requested 상태에서만 가능)
 */
export async function deleteOutsourceOrder(id: string): Promise<ActionResult<void>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: '인증이 필요합니다.' };
    }

    const { data: record, error: fetchError } = await supabase
      .from('outsource_orders')
      .select('status, order_id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !record) {
      console.error('[deleteOutsourceOrder] Fetch error:', fetchError);
      return { error: '외주 발주를 찾을 수 없습니다.' };
    }

    if (record.status !== 'requested') {
      return { error: '의뢰(requested) 상태에서만 삭제할 수 있습니다.' };
    }

    const { error: deleteError } = await supabase
      .from('outsource_orders')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (deleteError) {
      console.error('[deleteOutsourceOrder] Delete error:', deleteError);
      return { error: deleteError.message };
    }

    revalidatePath('/orders');
    revalidatePath(`/orders/${record.order_id}`);
    return { data: undefined };
  } catch (err) {
    console.error('[deleteOutsourceOrder] Unexpected error:', err);
    return { error: '외주 발주 삭제 중 오류가 발생했습니다.' };
  }
}

/**
 * 주문별 외주 요약 (총 건수, 완료 건수, 총 외주비, 전체 완료 여부)
 */
export async function getOutsourceOrderSummary(
  orderId: string
): Promise<ActionResult<OutsourceOrderSummary>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: '인증이 필요합니다.' };
    }

    const { data, error } = await supabase
      .from('outsource_orders')
      .select('status, amount')
      .eq('order_id', orderId)
      .eq('user_id', user.id);

    if (error) {
      console.error('[getOutsourceOrderSummary] Supabase error:', error);
      return { error: error.message };
    }

    const total = data.length;
    const completed = data.filter((r) => r.status === 'completed').length;
    const totalAmount = data.reduce((sum, r) => sum + (r.amount ?? 0), 0);
    const allCompleted = total > 0 && completed === total;

    return {
      data: {
        total,
        completed,
        totalAmount,
        allCompleted,
      },
    };
  } catch (err) {
    console.error('[getOutsourceOrderSummary] Unexpected error:', err);
    return { error: '외주 발주 요약 조회 중 오류가 발생했습니다.' };
  }
}
