'use server';

import { createClient } from '@/lib/supabase/server';
import type { Database } from '@/lib/database.types';

type OutsourceOrderRow = Database['public']['Tables']['outsource_orders']['Row'];

export type OutsourceStatus = 'requested' | 'in_progress' | 'completed' | 'cancelled';
export type OutsourceType = 'system' | 'curtain';

export interface ActionResult<T = unknown> {
  data?: T;
  count?: number;
  error?: string;
}

export interface OutsourceOrderWithDetails extends OutsourceOrderRow {
  supplier: { id: string; name: string; phone: string | null } | null;
  order: {
    id: string;
    order_number: string;
    customer: { id: string; name: string; phone: string | null } | null;
  } | null;
}

/**
 * 전체 외주 발주 목록 조회 (주문별이 아닌 전체)
 */
export async function getAllOutsourceOrders(params: {
  status?: OutsourceStatus;
  outsource_type?: OutsourceType;
  search?: string;
  page?: number;
  limit?: number;
}): Promise<ActionResult<OutsourceOrderWithDetails[]>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: '인증이 필요합니다.' };
    }

    const { status, outsource_type, search, page = 1, limit = 100 } = params;
    const offset = (page - 1) * limit;

    let query = supabase
      .from('outsource_orders')
      .select(
        `
        *,
        supplier:suppliers(id, name, phone),
        order:orders(
          id,
          order_number,
          customer:customers(id, name, phone)
        )
      `,
        { count: 'exact' }
      )
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq('status', status);
    }

    if (outsource_type) {
      query = query.eq('outsource_type', outsource_type);
    }

    if (search) {
      // outsource_number 직접 필터 (관계 컬럼 or 필터는 지원 안 됨)
      query = query.ilike('outsource_number', `%${search}%`);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('[getAllOutsourceOrders] Supabase error:', error);
      return { error: error.message };
    }

    return { data: (data ?? []) as OutsourceOrderWithDetails[], count: count ?? 0 };
  } catch (err) {
    console.error('[getAllOutsourceOrders] Unexpected error:', err);
    return { error: '외주 발주 목록 조회 중 오류가 발생했습니다.' };
  }
}
