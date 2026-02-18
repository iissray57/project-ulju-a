'use server';

import { createClient } from '@/lib/supabase/server';
import { customerSchema, type CustomerSearchParams } from '@/lib/schemas/customer';
import type { Database } from '@/lib/database.types';

type Customer = Database['public']['Tables']['customers']['Row'];
type CustomerInsert = Database['public']['Tables']['customers']['Insert'];
type CustomerUpdate = Database['public']['Tables']['customers']['Update'];

interface ActionResult<T = unknown> {
  data?: T;
  error?: string;
  count?: number;
}

/**
 * 고객 목록 조회 (검색, 페이지네이션 지원)
 */
export async function getCustomers(
  params?: CustomerSearchParams
): Promise<ActionResult<Customer[]>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: '인증이 필요합니다' };
    }

    const { query = '', offset = 0, limit = 20 } = params || {};

    let queryBuilder = supabase
      .from('customers')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    // 검색 (name, phone, address)
    if (query) {
      queryBuilder = queryBuilder.or(
        `name.ilike.%${query}%,phone.ilike.%${query}%,address.ilike.%${query}%`
      );
    }

    // 페이지네이션
    queryBuilder = queryBuilder.range(offset, offset + limit - 1);

    const { data, error, count } = await queryBuilder;

    if (error) {
      return { error: `고객 목록 조회 실패: ${error.message}` };
    }

    return { data: data || [], count: count || 0 };
  } catch (err) {
    return {
      error: `고객 목록 조회 중 오류 발생: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

/**
 * 단건 고객 조회
 */
export async function getCustomer(id: string): Promise<ActionResult<Customer>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: '인증이 필요합니다' };
    }

    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (error) {
      return { error: `고객 조회 실패: ${error.message}` };
    }

    if (!data) {
      return { error: '고객을 찾을 수 없습니다' };
    }

    return { data };
  } catch (err) {
    return {
      error: `고객 조회 중 오류 발생: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

/**
 * 고객 상세 조회 (주문 목록 포함)
 */
export async function getCustomerWithOrders(id: string): Promise<ActionResult<Customer & {
  orders: {
    id: string;
    order_number: string;
    status: string | null;
    work_type: string | null;
    quotation_amount: number | null;
    confirmed_amount: number | null;
    measurement_date: string | null;
    installation_date: string | null;
    created_at: string | null;
  }[];
}>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: '인증이 필요합니다' };
    }

    const { data, error } = await supabase
      .from('customers')
      .select(`
        *,
        orders(id, order_number, status, work_type, quotation_amount, confirmed_amount, measurement_date, installation_date, created_at)
      `)
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (error) {
      return { error: `고객 조회 실패: ${error.message}` };
    }

    if (!data) {
      return { error: '고객을 찾을 수 없습니다' };
    }

    // orders 정렬 (최신순)
    const orders = (data.orders || []).sort((a: { created_at: string | null }, b: { created_at: string | null }) =>
      (b.created_at || '').localeCompare(a.created_at || '')
    );

    return { data: { ...data, orders } };
  } catch (err) {
    return {
      error: `고객 조회 중 오류 발생: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

/**
 * 고객 생성 (중복 시 기존 고객 반환)
 */
export async function createCustomer(
  input: unknown
): Promise<ActionResult<Customer>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: '인증이 필요합니다' };
    }

    const parsed = customerSchema.safeParse(input);
    if (!parsed.success) {
      return { error: `입력값 검증 실패: ${parsed.error.message}` };
    }

    // 중복 체크: 같은 이름 + 전화번호 고객이 있는지 확인
    const { data: existing } = await supabase
      .from('customers')
      .select('*')
      .eq('user_id', user.id)
      .eq('name', parsed.data.name)
      .eq('phone', parsed.data.phone || '')
      .maybeSingle();

    if (existing) {
      // 기존 고객 반환 (주소가 다르면 업데이트)
      if (parsed.data.address && parsed.data.address !== existing.address) {
        const { data: updated } = await supabase
          .from('customers')
          .update({ address: parsed.data.address, updated_at: new Date().toISOString() })
          .eq('id', existing.id)
          .select()
          .single();
        return { data: updated || existing };
      }
      return { data: existing };
    }

    const insertData: CustomerInsert = {
      ...parsed.data,
      user_id: user.id,
    };

    const { data, error } = await supabase
      .from('customers')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      // 중복 제약 위반 시 기존 고객 조회 후 반환
      if (error.code === '23505') {
        const { data: existingCustomer } = await supabase
          .from('customers')
          .select('*')
          .eq('user_id', user.id)
          .eq('name', parsed.data.name)
          .eq('phone', parsed.data.phone || '')
          .single();
        if (existingCustomer) {
          return { data: existingCustomer };
        }
      }
      return { error: `고객 생성 실패: ${error.message}` };
    }

    return { data };
  } catch (err) {
    return {
      error: `고객 생성 중 오류 발생: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

/**
 * 고객 정보 수정
 */
export async function updateCustomer(
  id: string,
  input: unknown
): Promise<ActionResult<Customer>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: '인증이 필요합니다' };
    }

    const parsed = customerSchema.safeParse(input);
    if (!parsed.success) {
      return { error: `입력값 검증 실패: ${parsed.error.message}` };
    }

    const updateData: CustomerUpdate = {
      ...parsed.data,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('customers')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      return { error: `고객 정보 수정 실패: ${error.message}` };
    }

    if (!data) {
      return { error: '고객을 찾을 수 없습니다' };
    }

    return { data };
  } catch (err) {
    return {
      error: `고객 정보 수정 중 오류 발생: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

/**
 * 고객 삭제
 */
export async function deleteCustomer(id: string): Promise<ActionResult<void>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: '인증이 필요합니다' };
    }

    const { error } = await supabase
      .from('customers')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      return { error: `고객 삭제 실패: ${error.message}` };
    }

    return { data: undefined };
  } catch (err) {
    return {
      error: `고객 삭제 중 오류 발생: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}
