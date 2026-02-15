'use server';

import { createClient } from '@/lib/supabase/server';
import { supplierSchema, type SupplierSearchParams } from '@/lib/schemas/supplier';

interface ActionResult<T = unknown> {
  data?: T;
  error?: string;
  count?: number;
}

interface Supplier {
  id: string;
  user_id: string;
  name: string;
  phone: string | null;
  address: string | null;
  business_number: string | null;
  contact_person: string | null;
  memo: string | null;
  is_active: boolean | null;
  created_at: string | null;
  updated_at: string | null;
}

/**
 * 거래처 목록 조회
 */
export async function getSuppliers(
  params?: SupplierSearchParams
): Promise<ActionResult<Supplier[]>> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { error: '인증이 필요합니다' };
    }

    const { query = '', offset = 0, limit = 20, isActive } = params || {};

    let queryBuilder = supabase
      .from('suppliers')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)
      .order('name', { ascending: true });

    if (query) {
      queryBuilder = queryBuilder.or(
        `name.ilike.%${query}%,phone.ilike.%${query}%,contact_person.ilike.%${query}%`
      );
    }

    if (isActive !== undefined) {
      queryBuilder = queryBuilder.eq('is_active', isActive);
    }

    queryBuilder = queryBuilder.range(offset, offset + limit - 1);

    const { data, error, count } = await queryBuilder;

    if (error) {
      return { error: `거래처 목록 조회 실패: ${error.message}` };
    }

    return { data: data || [], count: count || 0 };
  } catch (err) {
    return {
      error: `거래처 목록 조회 중 오류: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

/**
 * 단건 거래처 조회
 */
export async function getSupplier(id: string): Promise<ActionResult<Supplier>> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { error: '인증이 필요합니다' };
    }

    const { data, error } = await supabase
      .from('suppliers')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (error) {
      return { error: `거래처 조회 실패: ${error.message}` };
    }

    return { data };
  } catch (err) {
    return {
      error: `거래처 조회 중 오류: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

/**
 * 거래처 생성 (중복 시 기존 반환)
 */
export async function createSupplier(
  input: unknown
): Promise<ActionResult<Supplier>> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { error: '인증이 필요합니다' };
    }

    const parsed = supplierSchema.safeParse(input);
    if (!parsed.success) {
      return { error: `입력값 검증 실패: ${parsed.error.message}` };
    }

    // 중복 체크
    const { data: existing } = await supabase
      .from('suppliers')
      .select('*')
      .eq('user_id', user.id)
      .eq('name', parsed.data.name)
      .eq('phone', parsed.data.phone || '')
      .maybeSingle();

    if (existing) {
      return { data: existing };
    }

    const { data, error } = await supabase
      .from('suppliers')
      .insert({
        ...parsed.data,
        user_id: user.id,
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        const { data: existingSupplier } = await supabase
          .from('suppliers')
          .select('*')
          .eq('user_id', user.id)
          .eq('name', parsed.data.name)
          .single();
        if (existingSupplier) {
          return { data: existingSupplier };
        }
      }
      return { error: `거래처 생성 실패: ${error.message}` };
    }

    return { data };
  } catch (err) {
    return {
      error: `거래처 생성 중 오류: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

/**
 * 거래처 수정
 */
export async function updateSupplier(
  id: string,
  input: unknown
): Promise<ActionResult<Supplier>> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { error: '인증이 필요합니다' };
    }

    const parsed = supplierSchema.safeParse(input);
    if (!parsed.success) {
      return { error: `입력값 검증 실패: ${parsed.error.message}` };
    }

    const { data, error } = await supabase
      .from('suppliers')
      .update({
        ...parsed.data,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      return { error: `거래처 수정 실패: ${error.message}` };
    }

    return { data };
  } catch (err) {
    return {
      error: `거래처 수정 중 오류: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

/**
 * 거래처 삭제
 */
export async function deleteSupplier(id: string): Promise<ActionResult<void>> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { error: '인증이 필요합니다' };
    }

    const { error } = await supabase
      .from('suppliers')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      return { error: `거래처 삭제 실패: ${error.message}` };
    }

    return { data: undefined };
  } catch (err) {
    return {
      error: `거래처 삭제 중 오류: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}
