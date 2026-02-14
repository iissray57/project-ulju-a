'use server';

import { createClient } from '@/lib/supabase/server';
import type { Database, TablesInsert, TablesUpdate } from '@/lib/database.types';
import {
  purchaseOrderFormSchema,
  type PurchaseOrderFormData,
  purchaseOrderItemSchema,
  type PurchaseOrderItemData,
  canTransitionPO,
  type PoStatus,
} from '@/lib/schemas/purchase-order';
import { revalidatePath } from 'next/cache';

type PurchaseOrderRow = Database['public']['Tables']['purchase_orders']['Row'];
type PurchaseOrderInsert = TablesInsert<'purchase_orders'>;
type PurchaseOrderUpdate = TablesUpdate<'purchase_orders'>;
type PurchaseOrderItemRow = Database['public']['Tables']['purchase_order_items']['Row'];
type PurchaseOrderItemInsert = TablesInsert<'purchase_order_items'>;
type PurchaseOrderItemUpdate = TablesUpdate<'purchase_order_items'>;

// 목록 조회 파라미터
export interface GetPurchaseOrdersParams {
  status?: PoStatus;
  search?: string; // po_number 또는 supplier_name 검색
  page?: number;
  limit?: number;
}

// 공통 결과 타입
export interface ActionResult<T = unknown> {
  data?: T;
  error?: string;
  count?: number;
}

/**
 * 발주 목록 조회 (상태 필터, 검색, 페이지네이션 지원)
 */
export async function getPurchaseOrders(
  params: GetPurchaseOrdersParams = {}
): Promise<ActionResult<PurchaseOrderRow[]>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: '인증이 필요합니다.' };
    }

    const { status, search, page = 1, limit = 20 } = params;
    const offset = (page - 1) * limit;

    // 쿼리 빌드
    let query = supabase
      .from('purchase_orders')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id);

    // 상태 필터
    if (status) {
      query = query.eq('status', status);
    }

    // 검색: po_number 또는 supplier_name
    if (search) {
      query = query.or(`po_number.ilike.%${search}%,supplier_name.ilike.%${search}%`);
    }

    // 정렬 및 페이지네이션
    query = query.order('created_at', { ascending: false }).range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('[getPurchaseOrders] Supabase error:', error);
      return { error: error.message };
    }

    return { data: data || [], count: count ?? 0 };
  } catch (err) {
    console.error('[getPurchaseOrders] Unexpected error:', err);
    return { error: '발주 목록 조회 중 오류가 발생했습니다.' };
  }
}

/**
 * 단건 조회 (items 포함)
 */
export async function getPurchaseOrder(
  id: string
): Promise<ActionResult<PurchaseOrderRow & { items: PurchaseOrderItemRow[] }>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: '인증이 필요합니다.' };
    }

    const { data, error } = await supabase
      .from('purchase_orders')
      .select(
        `
        *,
        items:purchase_order_items(*)
      `
      )
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (error) {
      console.error('[getPurchaseOrder] Supabase error:', error);
      return { error: error.message };
    }

    if (!data) {
      return { error: '발주를 찾을 수 없습니다.' };
    }

    return { data: data as PurchaseOrderRow & { items: PurchaseOrderItemRow[] } };
  } catch (err) {
    console.error('[getPurchaseOrder] Unexpected error:', err);
    return { error: '발주 조회 중 오류가 발생했습니다.' };
  }
}

/**
 * 발주 생성 (자동 채번)
 */
export async function createPurchaseOrder(
  formData: PurchaseOrderFormData
): Promise<ActionResult<PurchaseOrderRow>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: '인증이 필요합니다.' };
    }

    // 입력 검증
    const parsed = purchaseOrderFormSchema.safeParse(formData);
    if (!parsed.success) {
      return { error: '입력 값이 유효하지 않습니다.' };
    }

    // 자동 채번: generate_po_number() RPC 호출
    const { data: poNumber, error: rpcError } = await supabase.rpc('generate_po_number');

    if (rpcError || !poNumber) {
      console.error('[createPurchaseOrder] RPC error:', rpcError);
      return { error: '발주번호 생성에 실패했습니다.' };
    }

    // INSERT
    const insertData: PurchaseOrderInsert = {
      user_id: user.id,
      po_number: poNumber,
      supplier_name: parsed.data.supplier_name ?? null,
      supplier_phone: parsed.data.supplier_phone ?? null,
      total_amount: parsed.data.total_amount,
      payment_date: parsed.data.payment_date ?? null,
      memo: parsed.data.memo ?? null,
      status: 'draft', // 초기 상태
    };

    const { data, error } = await supabase
      .from('purchase_orders')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('[createPurchaseOrder] Insert error:', error);
      return { error: error.message };
    }

    revalidatePath('/purchases');
    return { data };
  } catch (err) {
    console.error('[createPurchaseOrder] Unexpected error:', err);
    return { error: '발주 생성 중 오류가 발생했습니다.' };
  }
}

/**
 * 발주 수정
 */
export async function updatePurchaseOrder(
  id: string,
  formData: Partial<PurchaseOrderFormData>
): Promise<ActionResult<PurchaseOrderRow>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: '인증이 필요합니다.' };
    }

    // 부분 입력 검증
    const parsed = purchaseOrderFormSchema.partial().safeParse(formData);
    if (!parsed.success) {
      return { error: '입력 값이 유효하지 않습니다.' };
    }

    // UPDATE
    const updateData: PurchaseOrderUpdate = {
      ...(parsed.data.supplier_name !== undefined && {
        supplier_name: parsed.data.supplier_name ?? null,
      }),
      ...(parsed.data.supplier_phone !== undefined && {
        supplier_phone: parsed.data.supplier_phone ?? null,
      }),
      ...(parsed.data.total_amount !== undefined && {
        total_amount: parsed.data.total_amount,
      }),
      ...(parsed.data.payment_date !== undefined && {
        payment_date: parsed.data.payment_date ?? null,
      }),
      ...(parsed.data.memo !== undefined && { memo: parsed.data.memo ?? null }),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('purchase_orders')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      console.error('[updatePurchaseOrder] Update error:', error);
      return { error: error.message };
    }

    if (!data) {
      return { error: '발주를 찾을 수 없습니다.' };
    }

    revalidatePath('/purchases');
    revalidatePath(`/purchases/${id}`);
    return { data };
  } catch (err) {
    console.error('[updatePurchaseOrder] Unexpected error:', err);
    return { error: '발주 수정 중 오류가 발생했습니다.' };
  }
}

/**
 * 발주 삭제 (draft 상태에서만 가능)
 */
export async function deletePurchaseOrder(id: string): Promise<ActionResult<void>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: '인증이 필요합니다.' };
    }

    // 현재 상태 확인
    const { data: purchaseOrder, error: fetchError } = await supabase
      .from('purchase_orders')
      .select('status')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !purchaseOrder) {
      console.error('[deletePurchaseOrder] Fetch error:', fetchError);
      return { error: '발주를 찾을 수 없습니다.' };
    }

    // draft 상태가 아니면 삭제 불가
    if (purchaseOrder.status !== 'draft') {
      return {
        error: '임시저장(draft) 상태에서만 삭제할 수 있습니다.',
      };
    }

    // DELETE
    const { error: deleteError } = await supabase
      .from('purchase_orders')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (deleteError) {
      console.error('[deletePurchaseOrder] Delete error:', deleteError);
      return { error: deleteError.message };
    }

    revalidatePath('/purchases');
    return { data: undefined };
  } catch (err) {
    console.error('[deletePurchaseOrder] Unexpected error:', err);
    return { error: '발주 삭제 중 오류가 발생했습니다.' };
  }
}

/**
 * 발주 상태 전이
 * - PO_TRANSITIONS 규칙에 따라 전이 가능 여부 검증
 */
export async function transitionPurchaseOrderStatus(
  id: string,
  newStatus: PoStatus
): Promise<ActionResult<PurchaseOrderRow>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: '인증이 필요합니다.' };
    }

    // 현재 상태 확인
    const { data: purchaseOrder, error: fetchError } = await supabase
      .from('purchase_orders')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !purchaseOrder) {
      console.error('[transitionPurchaseOrderStatus] Fetch error:', fetchError);
      return { error: '발주를 찾을 수 없습니다.' };
    }

    const currentStatus = purchaseOrder.status;

    // 전이 가능 여부 검증
    if (!canTransitionPO(currentStatus, newStatus)) {
      return {
        error: `${currentStatus} 상태에서 ${newStatus} 상태로 전이할 수 없습니다.`,
      };
    }

    // 상태 UPDATE
    const { data, error } = await supabase
      .from('purchase_orders')
      .update({
        status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      console.error('[transitionPurchaseOrderStatus] Update error:', error);
      return { error: error.message };
    }

    if (!data) {
      return { error: '상태 전이 후 데이터 조회에 실패했습니다.' };
    }

    revalidatePath('/purchases');
    revalidatePath(`/purchases/${id}`);
    return { data };
  } catch (err) {
    console.error('[transitionPurchaseOrderStatus] Unexpected error:', err);
    return { error: '상태 전이 중 오류가 발생했습니다.' };
  }
}

/**
 * 발주 품목 목록 조회
 */
export async function getPurchaseOrderItems(
  poId: string
): Promise<ActionResult<PurchaseOrderItemRow[]>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: '인증이 필요합니다.' };
    }

    // PO 소유권 확인
    const { data: po, error: poError } = await supabase
      .from('purchase_orders')
      .select('id')
      .eq('id', poId)
      .eq('user_id', user.id)
      .single();

    if (poError || !po) {
      console.error('[getPurchaseOrderItems] PO not found:', poError);
      return { error: '발주를 찾을 수 없습니다.' };
    }

    // 품목 조회
    const { data, error } = await supabase
      .from('purchase_order_items')
      .select('*')
      .eq('purchase_order_id', poId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('[getPurchaseOrderItems] Supabase error:', error);
      return { error: error.message };
    }

    return { data: data || [] };
  } catch (err) {
    console.error('[getPurchaseOrderItems] Unexpected error:', err);
    return { error: '품목 목록 조회 중 오류가 발생했습니다.' };
  }
}

/**
 * 발주 품목 추가
 */
export async function addPurchaseOrderItem(
  poId: string,
  itemData: PurchaseOrderItemData
): Promise<ActionResult<PurchaseOrderItemRow>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: '인증이 필요합니다.' };
    }

    // PO 소유권 확인
    const { data: po, error: poError } = await supabase
      .from('purchase_orders')
      .select('id')
      .eq('id', poId)
      .eq('user_id', user.id)
      .single();

    if (poError || !po) {
      console.error('[addPurchaseOrderItem] PO not found:', poError);
      return { error: '발주를 찾을 수 없습니다.' };
    }

    // 입력 검증
    const parsed = purchaseOrderItemSchema.safeParse(itemData);
    if (!parsed.success) {
      return { error: '입력 값이 유효하지 않습니다.' };
    }

    // INSERT
    const insertData: PurchaseOrderItemInsert = {
      purchase_order_id: poId,
      product_id: parsed.data.product_id ?? null,
      quantity: parsed.data.quantity,
      unit_price: parsed.data.unit_price,
      memo: parsed.data.memo ?? null,
    };

    const { data, error } = await supabase
      .from('purchase_order_items')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('[addPurchaseOrderItem] Insert error:', error);
      return { error: error.message };
    }

    revalidatePath('/purchases');
    revalidatePath(`/purchases/${poId}`);
    return { data };
  } catch (err) {
    console.error('[addPurchaseOrderItem] Unexpected error:', err);
    return { error: '품목 추가 중 오류가 발생했습니다.' };
  }
}

/**
 * 발주 품목 수정
 */
export async function updatePurchaseOrderItem(
  itemId: string,
  itemData: Partial<PurchaseOrderItemData>
): Promise<ActionResult<PurchaseOrderItemRow>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: '인증이 필요합니다.' };
    }

    // 품목 조회 및 PO 소유권 확인
    const { data: item, error: itemError } = await supabase
      .from('purchase_order_items')
      .select('*, purchase_order:purchase_orders!inner(user_id)')
      .eq('id', itemId)
      .single();

    if (itemError || !item) {
      console.error('[updatePurchaseOrderItem] Item not found:', itemError);
      return { error: '품목을 찾을 수 없습니다.' };
    }

    // @ts-expect-error - join 결과 타입 불일치
    if (item.purchase_order?.user_id !== user.id) {
      return { error: '권한이 없습니다.' };
    }

    // 부분 입력 검증
    const parsed = purchaseOrderItemSchema.partial().safeParse(itemData);
    if (!parsed.success) {
      return { error: '입력 값이 유효하지 않습니다.' };
    }

    // UPDATE
    const updateData: PurchaseOrderItemUpdate = {
      ...(parsed.data.product_id !== undefined && {
        product_id: parsed.data.product_id ?? null,
      }),
      ...(parsed.data.quantity !== undefined && { quantity: parsed.data.quantity }),
      ...(parsed.data.unit_price !== undefined && { unit_price: parsed.data.unit_price }),
      ...(parsed.data.memo !== undefined && { memo: parsed.data.memo ?? null }),
    };

    const { data, error } = await supabase
      .from('purchase_order_items')
      .update(updateData)
      .eq('id', itemId)
      .select()
      .single();

    if (error) {
      console.error('[updatePurchaseOrderItem] Update error:', error);
      return { error: error.message };
    }

    if (!data) {
      return { error: '품목 수정에 실패했습니다.' };
    }

    revalidatePath('/purchases');
    revalidatePath(`/purchases/${item.purchase_order_id}`);
    return { data };
  } catch (err) {
    console.error('[updatePurchaseOrderItem] Unexpected error:', err);
    return { error: '품목 수정 중 오류가 발생했습니다.' };
  }
}

/**
 * 발주 품목 삭제
 */
export async function removePurchaseOrderItem(itemId: string): Promise<ActionResult<void>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: '인증이 필요합니다.' };
    }

    // 품목 조회 및 PO 소유권 확인
    const { data: item, error: itemError } = await supabase
      .from('purchase_order_items')
      .select('*, purchase_order:purchase_orders!inner(user_id)')
      .eq('id', itemId)
      .single();

    if (itemError || !item) {
      console.error('[removePurchaseOrderItem] Item not found:', itemError);
      return { error: '품목을 찾을 수 없습니다.' };
    }

    // @ts-expect-error - join 결과 타입 불일치
    if (item.purchase_order?.user_id !== user.id) {
      return { error: '권한이 없습니다.' };
    }

    // DELETE
    const { error: deleteError } = await supabase
      .from('purchase_order_items')
      .delete()
      .eq('id', itemId);

    if (deleteError) {
      console.error('[removePurchaseOrderItem] Delete error:', deleteError);
      return { error: deleteError.message };
    }

    revalidatePath('/purchases');
    revalidatePath(`/purchases/${item.purchase_order_id}`);
    return { data: undefined };
  } catch (err) {
    console.error('[removePurchaseOrderItem] Unexpected error:', err);
    return { error: '품목 삭제 중 오류가 발생했습니다.' };
  }
}
