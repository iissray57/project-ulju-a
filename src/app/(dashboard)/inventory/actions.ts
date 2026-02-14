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
type InventoryTransactionRow =
  Database['public']['Tables']['inventory_transactions']['Row'];
type InventoryTransactionInsert =
  Database['public']['Tables']['inventory_transactions']['Insert'];

export interface InventoryTransactionWithProduct extends InventoryTransactionRow {
  product: {
    id: string;
    name: string;
    category: string | null;
    sku: string;
    unit: string;
  } | null;
}

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

// ===== INVENTORY MANAGEMENT ACTIONS =====

export interface InventoryWithProduct extends InventoryRow {
  product: {
    id: string;
    name: string;
    category: string | null;
    sku: string;
    unit: string;
    min_stock: number;
  } | null;
}

/**
 * 재고 목록 조회 (product join, 가용재고 포함)
 */
export async function getInventoryList(
  params?: InventorySearchParams
): Promise<ActionResult<InventoryWithProduct[]>> {
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
      search,
      lowStockOnly = false,
      page = 1,
      limit = 20,
    } = params || {};

    const offset = (page - 1) * limit;

    let queryBuilder = supabase
      .from('inventory')
      .select(
        `
        *,
        product:products(id, name, category, sku, unit, min_stock)
      `,
        { count: 'exact' }
      )
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });

    // 카테고리 필터
    if (category) {
      queryBuilder = queryBuilder.eq('product.category', category);
    }

    // 검색 (product name/sku)
    if (search) {
      queryBuilder = queryBuilder.or(
        `product.name.ilike.%${search}%,product.sku.ilike.%${search}%`
      );
    }

    // 페이지네이션
    queryBuilder = queryBuilder.range(offset, offset + limit - 1);

    const { data, error, count } = await queryBuilder;

    if (error) {
      return { error: `재고 목록 조회 실패: ${error.message}` };
    }

    let items = (data || []) as InventoryWithProduct[];

    // 부족 재고 필터 (클라이언트 측 필터)
    if (lowStockOnly && items) {
      items = items.filter((item) => {
        const availableQty = item.quantity - item.held_quantity;
        const minStock = item.product?.min_stock || 0;
        return availableQty < minStock;
      });
    }

    return { data: items, count: count || 0 };
  } catch (err) {
    return {
      error: `재고 목록 조회 중 오류 발생: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

/**
 * 재고 입고 (직접 quantity 증가 + transaction 기록)
 */
export async function inboundInventory(
  data: InventoryInboundData
): Promise<ActionResult<void>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: '인증이 필요합니다' };
    }

    const parsed = inventoryInboundSchema.safeParse(data);
    if (!parsed.success) {
      return { error: `입력값 검증 실패: ${parsed.error.message}` };
    }

    const { product_id, quantity, purchase_order_id, memo } = parsed.data;

    // 1. 현재 inventory 조회 (없으면 생성)
    const { data: existingInventory, error: fetchError } = await supabase
      .from('inventory')
      .select('*')
      .eq('user_id', user.id)
      .eq('product_id', product_id)
      .maybeSingle();

    if (fetchError) {
      return { error: `재고 조회 실패: ${fetchError.message}` };
    }

    let currentQuantity = 0;

    if (!existingInventory) {
      // 재고 레코드 생성
      const { error: insertError } = await supabase
        .from('inventory')
        .insert({
          user_id: user.id,
          product_id,
          quantity,
          held_quantity: 0,
        });

      if (insertError) {
        return { error: `재고 생성 실패: ${insertError.message}` };
      }

      currentQuantity = 0;
    } else {
      // 기존 재고 업데이트
      currentQuantity = existingInventory.quantity;
      const newQuantity = currentQuantity + quantity;

      const { error: updateError } = await supabase
        .from('inventory')
        .update({
          quantity: newQuantity,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingInventory.id);

      if (updateError) {
        return { error: `재고 업데이트 실패: ${updateError.message}` };
      }
    }

    // 2. inventory_transactions에 기록
    const transactionData: InventoryTransactionInsert = {
      user_id: user.id,
      product_id,
      purchase_order_id,
      type: 'inbound' as TransactionType,
      quantity,
      before_quantity: currentQuantity,
      after_quantity: currentQuantity + quantity,
      memo,
    };

    const { error: transactionError } = await supabase
      .from('inventory_transactions')
      .insert(transactionData);

    if (transactionError) {
      return { error: `이력 기록 실패: ${transactionError.message}` };
    }

    revalidatePath('/inventory');

    return { data: undefined };
  } catch (err) {
    return {
      error: `입고 처리 중 오류 발생: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

/**
 * 재고 조정 (직접 quantity 설정 + transaction 기록)
 */
export async function adjustInventory(
  data: InventoryAdjustData
): Promise<ActionResult<void>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: '인증이 필요합니다' };
    }

    const parsed = inventoryAdjustSchema.safeParse(data);
    if (!parsed.success) {
      return { error: `입력값 검증 실패: ${parsed.error.message}` };
    }

    const { product_id, quantity, memo } = parsed.data;

    if (quantity < 0) {
      return { error: '재고는 0 이상이어야 합니다' };
    }

    // 1. 현재 inventory 조회
    const { data: existingInventory, error: fetchError } = await supabase
      .from('inventory')
      .select('*')
      .eq('user_id', user.id)
      .eq('product_id', product_id)
      .maybeSingle();

    if (fetchError) {
      return { error: `재고 조회 실패: ${fetchError.message}` };
    }

    if (!existingInventory) {
      return { error: '재고 레코드를 찾을 수 없습니다' };
    }

    const currentQuantity = existingInventory.quantity;
    const heldQuantity = existingInventory.held_quantity;

    // held_quantity 검증
    if (quantity < heldQuantity) {
      return {
        error: `재고는 hold된 수량(${heldQuantity}) 이상이어야 합니다`,
      };
    }

    // 2. 재고 업데이트
    const { error: updateError } = await supabase
      .from('inventory')
      .update({
        quantity,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existingInventory.id);

    if (updateError) {
      return { error: `재고 조정 실패: ${updateError.message}` };
    }

    // 3. inventory_transactions에 기록
    const transactionData: InventoryTransactionInsert = {
      user_id: user.id,
      product_id,
      type: 'adjustment' as TransactionType,
      quantity: quantity - currentQuantity,
      before_quantity: currentQuantity,
      after_quantity: quantity,
      memo,
    };

    const { error: transactionError } = await supabase
      .from('inventory_transactions')
      .insert(transactionData);

    if (transactionError) {
      return { error: `이력 기록 실패: ${transactionError.message}` };
    }

    revalidatePath('/inventory');

    return { data: undefined };
  } catch (err) {
    return {
      error: `재고 조정 중 오류 발생: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

/**
 * 재고 변동 이력 조회 (product join)
 */
export async function getInventoryTransactions(
  params?: InventoryTransactionSearchParams
): Promise<ActionResult<InventoryTransactionWithProduct[]>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: '인증이 필요합니다' };
    }

    const { productId, orderId, type, page = 1, limit = 50 } = params || {};

    const offset = (page - 1) * limit;

    let queryBuilder = supabase
      .from('inventory_transactions')
      .select(
        `
        *,
        product:products(id, name, category, sku, unit)
      `,
        { count: 'exact' }
      )
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (productId) {
      queryBuilder = queryBuilder.eq('product_id', productId);
    }

    if (orderId) {
      queryBuilder = queryBuilder.eq('order_id', orderId);
    }

    if (type) {
      queryBuilder = queryBuilder.eq('type', type);
    }

    queryBuilder = queryBuilder.range(offset, offset + limit - 1);

    const { data, error, count } = await queryBuilder;

    if (error) {
      return { error: `이력 조회 실패: ${error.message}` };
    }

    return { data: (data || []) as InventoryTransactionWithProduct[], count: count || 0 };
  } catch (err) {
    return {
      error: `이력 조회 중 오류 발생: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

/**
 * 부족 재고 목록 (available_quantity < min_stock)
 */
export async function getLowStockItems(): Promise<
  ActionResult<InventoryWithProduct[]>
> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: '인증이 필요합니다' };
    }

    const { data, error } = await supabase
      .from('inventory')
      .select(
        `
        *,
        product:products(id, name, category, sku, unit, min_stock)
      `
      )
      .eq('user_id', user.id);

    if (error) {
      return { error: `재고 조회 실패: ${error.message}` };
    }

    const items = (data || []) as InventoryWithProduct[];

    // available_quantity < min_stock 필터
    const lowStockItems = items.filter((item) => {
      const availableQty = item.quantity - item.held_quantity;
      const minStock = item.product?.min_stock || 0;
      return availableQty < minStock;
    });

    return { data: lowStockItems };
  } catch (err) {
    return {
      error: `부족 재고 조회 중 오류 발생: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

