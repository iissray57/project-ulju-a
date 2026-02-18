'use server';

import { createClient } from '@/lib/supabase/server';
import type { Database } from '@/lib/database.types';
import { revalidatePath } from 'next/cache';

type QuoteRequestRow = Database['public']['Tables']['quote_requests']['Row'];

export type QuoteRequestStatus = 'pending' | 'contacted' | 'quoted' | 'completed' | 'cancelled';

export interface GetQuoteRequestsParams {
  status?: QuoteRequestStatus;
  search?: string;
  page?: number;
  limit?: number;
}

export interface ActionResult<T = unknown> {
  data?: T;
  error?: string;
  count?: number;
}

/**
 * 견적요청 목록 조회 (상태 필터, 검색, 페이지네이션)
 */
export async function getQuoteRequests(
  params: GetQuoteRequestsParams = {}
): Promise<ActionResult<QuoteRequestRow[]>> {
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

    let query = supabase
      .from('quote_requests')
      .select('*', { count: 'exact' });

    if (status) {
      query = query.eq('status', status);
    }

    if (search) {
      query = query.or(
        `customer_name.ilike.%${search}%,customer_phone.ilike.%${search}%`
      );
    }

    query = query.order('created_at', { ascending: false }).range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('[getQuoteRequests] Supabase error:', error);
      return { error: error.message };
    }

    return { data: data as QuoteRequestRow[], count: count ?? 0 };
  } catch (err) {
    console.error('[getQuoteRequests] Unexpected error:', err);
    return { error: '견적요청 목록 조회 중 오류가 발생했습니다.' };
  }
}

/**
 * 견적요청 단건 조회
 */
export async function getQuoteRequest(id: string): Promise<ActionResult<QuoteRequestRow>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: '인증이 필요합니다.' };
    }

    const { data, error } = await supabase
      .from('quote_requests')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('[getQuoteRequest] Supabase error:', error);
      return { error: error.message };
    }

    if (!data) {
      return { error: '견적요청을 찾을 수 없습니다.' };
    }

    return { data: data as QuoteRequestRow };
  } catch (err) {
    console.error('[getQuoteRequest] Unexpected error:', err);
    return { error: '견적요청 조회 중 오류가 발생했습니다.' };
  }
}

/**
 * 견적요청 상태 변경 (contacted_at, completed_at 자동 기록)
 */
export async function updateQuoteRequestStatus(
  id: string,
  status: QuoteRequestStatus
): Promise<ActionResult<QuoteRequestRow>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: '인증이 필요합니다.' };
    }

    const now = new Date().toISOString();
    const updateData: Database['public']['Tables']['quote_requests']['Update'] = {
      status,
      updated_at: now,
      ...(status === 'contacted' ? { contacted_at: now } : {}),
      ...(status === 'completed' ? { completed_at: now } : {}),
    };

    const { data, error } = await supabase
      .from('quote_requests')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('[updateQuoteRequestStatus] Supabase error:', error);
      return { error: error.message };
    }

    revalidatePath('/quote-requests');
    return { data: data as QuoteRequestRow };
  } catch (err) {
    console.error('[updateQuoteRequestStatus] Unexpected error:', err);
    return { error: '상태 변경 중 오류가 발생했습니다.' };
  }
}

/**
 * 관리자 메모 수정
 */
export async function updateQuoteRequestNotes(
  id: string,
  notes: string
): Promise<ActionResult<QuoteRequestRow>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: '인증이 필요합니다.' };
    }

    const { data, error } = await supabase
      .from('quote_requests')
      .update({
        admin_notes: notes || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('[updateQuoteRequestNotes] Supabase error:', error);
      return { error: error.message };
    }

    revalidatePath('/quote-requests');
    return { data: data as QuoteRequestRow };
  } catch (err) {
    console.error('[updateQuoteRequestNotes] Unexpected error:', err);
    return { error: '메모 수정 중 오류가 발생했습니다.' };
  }
}

/**
 * 견적요청 삭제
 */
export async function deleteQuoteRequest(id: string): Promise<ActionResult<void>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: '인증이 필요합니다.' };
    }

    const { error } = await supabase
      .from('quote_requests')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('[deleteQuoteRequest] Supabase error:', error);
      return { error: error.message };
    }

    revalidatePath('/quote-requests');
    return { data: undefined };
  } catch (err) {
    console.error('[deleteQuoteRequest] Unexpected error:', err);
    return { error: '견적요청 삭제 중 오류가 발생했습니다.' };
  }
}

/**
 * 견적요청 → 주문 전환
 * - 전화번호로 기존 고객 검색, 없으면 자동 생성
 * - 주문 생성 후 주문 ID 반환
 */
export async function convertToOrder(
  id: string
): Promise<ActionResult<{ orderId: string; customerId: string }>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: '인증이 필요합니다.' };
    }

    // 견적요청 조회
    const { data: quoteRequest, error: fetchError } = await supabase
      .from('quote_requests')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !quoteRequest) {
      return { error: '견적요청을 찾을 수 없습니다.' };
    }

    // 전화번호로 기존 고객 검색
    let customerId: string;
    const { data: existingCustomer } = await supabase
      .from('customers')
      .select('id')
      .eq('user_id', user.id)
      .eq('phone', quoteRequest.customer_phone)
      .maybeSingle();

    if (existingCustomer) {
      customerId = existingCustomer.id;
    } else {
      // 새 고객 생성
      const { data: newCustomer, error: customerError } = await supabase
        .from('customers')
        .insert({
          user_id: user.id,
          name: quoteRequest.customer_name,
          phone: quoteRequest.customer_phone,
          address: quoteRequest.address,
        })
        .select('id')
        .single();

      if (customerError || !newCustomer) {
        console.error('[convertToOrder] Customer creation error:', customerError);
        return { error: '고객 생성에 실패했습니다.' };
      }

      customerId = newCustomer.id;
    }

    // 주문번호 자동 채번
    const { data: orderNumber, error: rpcError } = await supabase.rpc('generate_order_number');
    if (rpcError || !orderNumber) {
      console.error('[convertToOrder] RPC error:', rpcError);
      return { error: '주문번호 생성에 실패했습니다.' };
    }

    // 주문 생성 (category → work_type 매핑: angle/curtain/system 그대로 사용)
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: user.id,
        order_number: orderNumber,
        customer_id: customerId,
        work_type: quoteRequest.category,
        site_address: quoteRequest.address,
        memo: quoteRequest.description,
        status: 'inquiry',
      })
      .select('id')
      .single();

    if (orderError || !order) {
      console.error('[convertToOrder] Order creation error:', orderError);
      return { error: '주문 생성에 실패했습니다.' };
    }

    // 견적요청 상태를 completed로 변경
    await supabase
      .from('quote_requests')
      .update({ status: 'completed', completed_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq('id', id);

    revalidatePath('/quote-requests');
    revalidatePath('/orders');

    return { data: { orderId: order.id, customerId } };
  } catch (err) {
    console.error('[convertToOrder] Unexpected error:', err);
    return { error: '주문 전환 중 오류가 발생했습니다.' };
  }
}
