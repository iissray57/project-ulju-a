'use server';

import { createClient } from '@/lib/supabase/server';
import type { Database, TablesInsert, TablesUpdate } from '@/lib/database.types';
import { orderFormSchema, type OrderFormData } from '@/lib/schemas/order';
import { canTransition } from '@/lib/schemas/order-status';
import { syncOrderSchedule } from '@/lib/utils/order-schedule-sync';
import { revalidatePath } from 'next/cache';

type OrderRow = Database['public']['Tables']['orders']['Row'];
type OrderInsert = TablesInsert<'orders'>;
type OrderUpdate = TablesUpdate<'orders'>;
type OrderStatus = Database['public']['Enums']['order_status'];

// 목록 조회 파라미터
export interface GetOrdersParams {
  status?: OrderStatus;
  search?: string; // order_number 또는 customer name 검색
  page?: number;
  limit?: number;
}

// 목록 조회 결과 (customer 정보 포함)
export interface OrderWithCustomer extends OrderRow {
  customer: {
    id: string;
    name: string;
    phone: string;
  } | null;
}

// 공통 결과 타입
export interface ActionResult<T = unknown> {
  data?: T;
  error?: string;
  count?: number;
}

/**
 * 수주 목록 조회 (상태 필터, 검색, 페이지네이션 지원)
 */
export async function getOrders(
  params: GetOrdersParams = {}
): Promise<ActionResult<OrderWithCustomer[]>> {
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
      .from('orders')
      .select(
        `
        *,
        customer:customers(id, name, phone)
      `,
        { count: 'exact' }
      )
      .eq('user_id', user.id);

    // 상태 필터
    if (status) {
      query = query.eq('status', status);
    }

    // 검색: order_number 또는 customer name
    if (search) {
      query = query.or(
        `order_number.ilike.%${search}%,customer.name.ilike.%${search}%`
      );
    }

    // 정렬 및 페이지네이션
    query = query.order('created_at', { ascending: false }).range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('[getOrders] Supabase error:', error);
      return { error: error.message };
    }

    return { data: data as OrderWithCustomer[], count: count ?? 0 };
  } catch (err) {
    console.error('[getOrders] Unexpected error:', err);
    return { error: '수주 목록 조회 중 오류가 발생했습니다.' };
  }
}

/**
 * 단건 조회 (고객 정보 join)
 */
export async function getOrder(id: string): Promise<ActionResult<OrderWithCustomer>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: '인증이 필요합니다.' };
    }

    const { data, error } = await supabase
      .from('orders')
      .select(
        `
        *,
        customer:customers(id, name, phone)
      `
      )
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (error) {
      console.error('[getOrder] Supabase error:', error);
      return { error: error.message };
    }

    if (!data) {
      return { error: '수주를 찾을 수 없습니다.' };
    }

    return { data: data as OrderWithCustomer };
  } catch (err) {
    console.error('[getOrder] Unexpected error:', err);
    return { error: '수주 조회 중 오류가 발생했습니다.' };
  }
}

/**
 * 수주 생성 (자동 채번)
 */
export async function createOrder(
  formData: OrderFormData
): Promise<ActionResult<OrderRow>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: '인증이 필요합니다.' };
    }

    // 입력 검증
    const parsed = orderFormSchema.safeParse(formData);
    if (!parsed.success) {
      return { error: '입력 값이 유효하지 않습니다.' };
    }

    // 자동 채번: generate_order_number() RPC 호출
    const { data: orderNumber, error: rpcError } = await supabase.rpc(
      'generate_order_number'
    );

    if (rpcError || !orderNumber) {
      console.error('[createOrder] RPC error:', rpcError);
      return { error: '수주번호 생성에 실패했습니다.' };
    }

    // INSERT
    const insertData: OrderInsert = {
      user_id: user.id,
      order_number: orderNumber,
      customer_id: parsed.data.customer_id,
      closet_type: parsed.data.closet_type ?? null,
      closet_spec: parsed.data.closet_spec ?? null,
      quotation_amount: parsed.data.quotation_amount,
      confirmed_amount: parsed.data.confirmed_amount,
      measurement_date: parsed.data.measurement_date ?? null,
      installation_date: parsed.data.installation_date ?? null,
      site_address: parsed.data.site_address ?? null,
      site_memo: parsed.data.site_memo ?? null,
      memo: parsed.data.memo ?? null,
      status: 'inquiry', // 초기 상태
    };

    const { data, error } = await supabase
      .from('orders')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('[createOrder] Insert error:', error);
      return { error: error.message };
    }

    revalidatePath('/orders');
    return { data };
  } catch (err) {
    console.error('[createOrder] Unexpected error:', err);
    return { error: '수주 생성 중 오류가 발생했습니다.' };
  }
}

/**
 * 수주 수정
 */
export async function updateOrder(
  id: string,
  formData: Partial<OrderFormData>
): Promise<ActionResult<OrderRow>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: '인증이 필요합니다.' };
    }

    // 부분 입력 검증
    const parsed = orderFormSchema.partial().safeParse(formData);
    if (!parsed.success) {
      return { error: '입력 값이 유효하지 않습니다.' };
    }

    // UPDATE
    const updateData: OrderUpdate = {
      ...(parsed.data.customer_id && { customer_id: parsed.data.customer_id }),
      ...(parsed.data.closet_type && { closet_type: parsed.data.closet_type }),
      ...(parsed.data.closet_spec && { closet_spec: parsed.data.closet_spec }),
      ...(parsed.data.quotation_amount !== undefined && {
        quotation_amount: parsed.data.quotation_amount,
      }),
      ...(parsed.data.confirmed_amount !== undefined && {
        confirmed_amount: parsed.data.confirmed_amount,
      }),
      ...(parsed.data.measurement_date !== undefined && {
        measurement_date: parsed.data.measurement_date ?? null,
      }),
      ...(parsed.data.installation_date !== undefined && {
        installation_date: parsed.data.installation_date ?? null,
      }),
      ...(parsed.data.site_address !== undefined && {
        site_address: parsed.data.site_address ?? null,
      }),
      ...(parsed.data.site_memo !== undefined && {
        site_memo: parsed.data.site_memo ?? null,
      }),
      ...(parsed.data.memo !== undefined && { memo: parsed.data.memo ?? null }),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      console.error('[updateOrder] Update error:', error);
      return { error: error.message };
    }

    if (!data) {
      return { error: '수주를 찾을 수 없습니다.' };
    }

    revalidatePath('/orders');
    revalidatePath(`/orders/${id}`);
    return { data };
  } catch (err) {
    console.error('[updateOrder] Unexpected error:', err);
    return { error: '수주 수정 중 오류가 발생했습니다.' };
  }
}

/**
 * 수주 삭제 (inquiry 상태에서만 가능)
 */
export async function deleteOrder(id: string): Promise<ActionResult<void>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: '인증이 필요합니다.' };
    }

    // 현재 상태 확인
    const { data: order, error: fetchError } = await supabase
      .from('orders')
      .select('status')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !order) {
      console.error('[deleteOrder] Fetch error:', fetchError);
      return { error: '수주를 찾을 수 없습니다.' };
    }

    // inquiry 상태가 아니면 삭제 불가
    if (order.status !== 'inquiry') {
      return {
        error: '의뢰(inquiry) 상태에서만 삭제할 수 있습니다.',
      };
    }

    // DELETE
    const { error: deleteError } = await supabase
      .from('orders')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (deleteError) {
      console.error('[deleteOrder] Delete error:', deleteError);
      return { error: deleteError.message };
    }

    revalidatePath('/orders');
    return { data: undefined };
  } catch (err) {
    console.error('[deleteOrder] Unexpected error:', err);
    return { error: '수주 삭제 중 오류가 발생했습니다.' };
  }
}

/**
 * 수주 상태 전이
 * - ORDER_TRANSITIONS 규칙에 따라 전이 가능 여부 검증
 * - cancelled로 전이: cancel_order_cascade RPC 호출
 * - material_held로 전이: hold_materials_for_order RPC 호출
 * - installed로 전이: dispatch_materials_for_order RPC 호출
 * - 일반 전이: 직접 status UPDATE
 */
export async function transitionOrderStatus(
  orderId: string,
  newStatus: OrderStatus
): Promise<ActionResult<OrderRow>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: '인증이 필요합니다.' };
    }

    // 현재 상태 확인
    const { data: order, error: fetchError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !order) {
      console.error('[transitionOrderStatus] Fetch error:', fetchError);
      return { error: '수주를 찾을 수 없습니다.' };
    }

    const currentStatus = order.status;

    // 전이 가능 여부 검증
    if (!canTransition(currentStatus, newStatus)) {
      return {
        error: `${currentStatus} 상태에서 ${newStatus} 상태로 전이할 수 없습니다.`,
      };
    }

    // 상태별 처리
    if (newStatus === 'cancelled') {
      // cancel_order_cascade RPC 호출
      const { error: rpcError } = await supabase.rpc('cancel_order_cascade', {
        p_order_id: orderId,
      });

      if (rpcError) {
        console.error('[transitionOrderStatus] cancel_order_cascade error:', rpcError);
        return { error: '수주 취소 처리 중 오류가 발생했습니다.' };
      }
    } else if (newStatus === 'material_held') {
      // hold_materials_for_order RPC 호출
      const { error: rpcError } = await supabase.rpc('hold_materials_for_order', {
        p_order_id: orderId,
      });

      if (rpcError) {
        console.error('[transitionOrderStatus] hold_materials_for_order error:', rpcError);
        return { error: '자재 준비 처리 중 오류가 발생했습니다.' };
      }
    } else if (newStatus === 'installed') {
      // dispatch_materials_for_order RPC 호출
      const { error: rpcError } = await supabase.rpc('dispatch_materials_for_order', {
        p_order_id: orderId,
      });

      if (rpcError) {
        console.error('[transitionOrderStatus] dispatch_materials_for_order error:', rpcError);
        return { error: '자재 출고 처리 중 오류가 발생했습니다.' };
      }
    } else {
      // 일반 전이: 직접 status UPDATE
      const { error: updateError } = await supabase
        .from('orders')
        .update({
          status: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('id', orderId)
        .eq('user_id', user.id);

      if (updateError) {
        console.error('[transitionOrderStatus] Update error:', updateError);
        return { error: updateError.message };
      }
    }

    // 변경된 데이터 조회
    const { data: updatedOrder, error: refetchError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .eq('user_id', user.id)
      .single();

    if (refetchError || !updatedOrder) {
      console.error('[transitionOrderStatus] Refetch error:', refetchError);
      return { error: '업데이트 후 데이터 조회에 실패했습니다.' };
    }

    // 스케줄 자동 생성
    await syncOrderSchedule(orderId, newStatus, {
      order_number: order.order_number,
      measurement_date: order.measurement_date,
      installation_date: order.installation_date,
      site_address: order.site_address,
    });

    revalidatePath('/orders');
    revalidatePath(`/orders/${orderId}`);
    revalidatePath('/schedule');
    return { data: updatedOrder };
  } catch (err) {
    console.error('[transitionOrderStatus] Unexpected error:', err);
    return { error: '상태 전이 중 오류가 발생했습니다.' };
  }
}
