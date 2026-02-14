'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import {
  productFormSchema,
  type ProductFormData,
  type ProductSearchParams,
} from '@/lib/schemas/product';
import {
  inventoryInboundSchema,
  inventoryAdjustSchema,
  type InventoryInboundData,
  type InventoryAdjustData,
  type InventorySearchParams,
  type InventoryTransactionSearchParams,
  type TransactionType,
} from '@/lib/schemas/inventory';
import type { Database } from '@/lib/database.types';

type ProductRow = Database['public']['Tables']['products']['Row'];
type ProductInsert = Database['public']['Tables']['products']['Insert'];
type ProductUpdate = Database['public']['Tables']['products']['Update'];
type InventoryRow = Database['public']['Tables']['inventory']['Row'];
type InventoryInsert = Database['public']['Tables']['inventory']['Insert'];
type InventoryUpdate = Database['public']['Tables']['inventory']['Update'];
type InventoryTransactionRow =
  Database['public']['Tables']['inventory_transactions']['Row'];
type InventoryTransactionInsert =
  Database['public']['Tables']['inventory_transactions']['Insert'];

interface ActionResult<T = unknown> {
  data?: T;
  error?: string;
  count?: number;
}

/**
 * 제품 목록 조회 (카테고리 필터, 검색, 활성 필터, 페이지네이션)
 */
export async function getProducts(
  params?: ProductSearchParams
): Promise<ActionResult<ProductRow[]>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: '인증이 필요합니다' };
    }

    const {
      category,
      search = '',
      isActive,
      offset = 0,
      limit = 20,
    } = params || {};

    let queryBuilder = supabase
      .from('products')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    // 카테고리 필터
    if (category) {
      queryBuilder = queryBuilder.eq('category', category);
    }

    // 활성 상태 필터
    if (isActive !== undefined) {
      queryBuilder = queryBuilder.eq('is_active', isActive);
    }

    // 검색 (name, sku, memo)
    if (search) {
      queryBuilder = queryBuilder.or(
        `name.ilike.%${search}%,sku.ilike.%${search}%,memo.ilike.%${search}%`
      );
    }

    // 페이지네이션
    queryBuilder = queryBuilder.range(offset, offset + limit - 1);

    const { data, error, count } = await queryBuilder;

    if (error) {
      return { error: `제품 목록 조회 실패: ${error.message}` };
    }

    return { data: data || [], count: count || 0 };
  } catch (err) {
    return {
      error: `제품 목록 조회 중 오류 발생: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

/**
 * 제품 단건 조회
 */
export async function getProduct(id: string): Promise<ActionResult<ProductRow>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: '인증이 필요합니다' };
    }

    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (error) {
      return { error: `제품 조회 실패: ${error.message}` };
    }

    if (!data) {
      return { error: '제품을 찾을 수 없습니다' };
    }

    return { data };
  } catch (err) {
    return {
      error: `제품 조회 중 오류 발생: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

/**
 * 제품 생성
 */
export async function createProduct(
  formData: ProductFormData
): Promise<ActionResult<ProductRow>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: '인증이 필요합니다' };
    }

    const parsed = productFormSchema.safeParse(formData);
    if (!parsed.success) {
      return { error: `입력값 검증 실패: ${parsed.error.message}` };
    }

    const insertData: ProductInsert = {
      ...parsed.data,
      user_id: user.id,
    };

    const { data, error } = await supabase
      .from('products')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      return { error: `제품 생성 실패: ${error.message}` };
    }

    revalidatePath('/inventory');

    return { data };
  } catch (err) {
    return {
      error: `제품 생성 중 오류 발생: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

/**
 * 제품 수정
 */
export async function updateProduct(
  id: string,
  formData: Partial<ProductFormData>
): Promise<ActionResult<ProductRow>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: '인증이 필요합니다' };
    }

    const parsed = productFormSchema.partial().safeParse(formData);
    if (!parsed.success) {
      return { error: `입력값 검증 실패: ${parsed.error.message}` };
    }

    const updateData: ProductUpdate = {
      ...parsed.data,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('products')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      return { error: `제품 수정 실패: ${error.message}` };
    }

    if (!data) {
      return { error: '제품을 찾을 수 없습니다' };
    }

    revalidatePath('/inventory');

    return { data };
  } catch (err) {
    return {
      error: `제품 수정 중 오류 발생: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

/**
 * 제품 삭제 (soft delete - is_active = false)
 */
export async function deleteProduct(id: string): Promise<ActionResult<void>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: '인증이 필요합니다' };
    }

    const { error } = await supabase
      .from('products')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      return { error: `제품 삭제 실패: ${error.message}` };
    }

    revalidatePath('/inventory');

    return { data: undefined };
  } catch (err) {
    return {
      error: `제품 삭제 중 오류 발생: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}
