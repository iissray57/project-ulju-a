'use server';

import { createClient } from '@/lib/supabase/server';
import type { Database, TablesInsert } from '@/lib/database.types';
import {
  revenueFormSchema,
  costFormSchema,
  type RevenueFormData,
  type CostFormData,
  type FinanceSummaryPeriod,
} from '@/lib/schemas/finance';
import { revalidatePath } from 'next/cache';

type RevenueRow = Database['public']['Tables']['revenue_records']['Row'];
type RevenueInsert = TablesInsert<'revenue_records'>;
type CostRow = Database['public']['Tables']['cost_records']['Row'];
type CostInsert = TablesInsert<'cost_records'>;

// 공통 결과 타입
export interface ActionResult<T = unknown> {
  data?: T;
  error?: string;
  count?: number;
}

// ============================================================================
// 매출 (Revenue) Actions
// ============================================================================

export interface GetRevenueParams {
  orderId?: string;
  startDate?: string; // ISO date
  endDate?: string; // ISO date
  page?: number;
  limit?: number;
}

/**
 * 매출 목록 조회 (기간 필터, 페이지네이션)
 */
export async function getRevenueRecords(
  params: GetRevenueParams = {}
): Promise<ActionResult<RevenueRow[]>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: '인증이 필요합니다.' };
    }

    const { orderId, startDate, endDate, page = 1, limit = 20 } = params;
    const offset = (page - 1) * limit;

    let query = supabase
      .from('revenue_records')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id);

    if (orderId) {
      query = query.eq('order_id', orderId);
    }

    if (startDate) {
      query = query.gte('confirmed_at', startDate);
    }

    if (endDate) {
      query = query.lte('confirmed_at', endDate);
    }

    query = query.order('confirmed_at', { ascending: false }).range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('[getRevenueRecords] Supabase error:', error);
      return { error: error.message };
    }

    return { data: data ?? [], count: count ?? 0 };
  } catch (err) {
    console.error('[getRevenueRecords] Unexpected error:', err);
    return { error: '매출 목록 조회 중 오류가 발생했습니다.' };
  }
}

/**
 * 매출 확정 기록 생성
 */
export async function createRevenueRecord(
  formData: RevenueFormData
): Promise<ActionResult<RevenueRow>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: '인증이 필요합니다.' };
    }

    const parsed = revenueFormSchema.safeParse(formData);
    if (!parsed.success) {
      return { error: '입력 값이 유효하지 않습니다.' };
    }

    const insertData: RevenueInsert = {
      user_id: user.id,
      order_id: parsed.data.order_id ?? null,
      confirmed_amount: parsed.data.confirmed_amount,
      confirmed_at: parsed.data.confirmed_at ?? null,
      payment_date: parsed.data.payment_date ?? null,
      payment_method: parsed.data.payment_method ?? null,
      memo: parsed.data.memo ?? null,
    };

    const { data, error } = await supabase
      .from('revenue_records')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('[createRevenueRecord] Insert error:', error);
      return { error: error.message };
    }

    revalidatePath('/finance');
    return { data };
  } catch (err) {
    console.error('[createRevenueRecord] Unexpected error:', err);
    return { error: '매출 확정 기록 생성 중 오류가 발생했습니다.' };
  }
}

/**
 * 매출 기록 삭제
 */
export async function deleteRevenueRecord(id: string): Promise<ActionResult<void>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: '인증이 필요합니다.' };
    }

    const { error } = await supabase
      .from('revenue_records')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('[deleteRevenueRecord] Delete error:', error);
      return { error: error.message };
    }

    revalidatePath('/finance');
    return { data: undefined };
  } catch (err) {
    console.error('[deleteRevenueRecord] Unexpected error:', err);
    return { error: '매출 기록 삭제 중 오류가 발생했습니다.' };
  }
}

/**
 * 특정 주문의 매출 이력 조회
 */
export async function getRevenueByOrder(
  orderId: string
): Promise<ActionResult<RevenueRow[]>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: '인증이 필요합니다.' };
    }

    const { data, error } = await supabase
      .from('revenue_records')
      .select('*')
      .eq('user_id', user.id)
      .eq('order_id', orderId)
      .order('confirmed_at', { ascending: false });

    if (error) {
      console.error('[getRevenueByOrder] Supabase error:', error);
      return { error: error.message };
    }

    return { data: data ?? [] };
  } catch (err) {
    console.error('[getRevenueByOrder] Unexpected error:', err);
    return { error: '주문별 매출 이력 조회 중 오류가 발생했습니다.' };
  }
}

/**
 * 기간별 매출 합계
 */
export async function getRevenueSummary(
  period: FinanceSummaryPeriod,
  year: number
): Promise<
  ActionResult<
    Array<{
      period: string;
      total_amount: number;
      count: number;
    }>
  >
> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: '인증이 필요합니다.' };
    }

    const startDate = `${year}-01-01`;
    const endDate = `${year}-12-31`;

    const { data, error } = await supabase
      .from('revenue_records')
      .select('confirmed_at, confirmed_amount')
      .eq('user_id', user.id)
      .gte('confirmed_at', startDate)
      .lte('confirmed_at', endDate)
      .order('confirmed_at');

    if (error) {
      console.error('[getRevenueSummary] Supabase error:', error);
      return { error: error.message };
    }

    // 클라이언트 측 집계
    const summary = new Map<string, { total: number; count: number }>();

    data?.forEach((record) => {
      if (!record.confirmed_at) return;

      const date = new Date(record.confirmed_at);
      let key = '';

      if (period === 'monthly') {
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      } else if (period === 'quarterly') {
        const quarter = Math.floor(date.getMonth() / 3) + 1;
        key = `${date.getFullYear()}-Q${quarter}`;
      } else {
        key = `${date.getFullYear()}`;
      }

      const existing = summary.get(key) ?? { total: 0, count: 0 };
      summary.set(key, {
        total: existing.total + record.confirmed_amount,
        count: existing.count + 1,
      });
    });

    const result = Array.from(summary.entries()).map(([period, { total, count }]) => ({
      period,
      total_amount: total,
      count,
    }));

    return { data: result };
  } catch (err) {
    console.error('[getRevenueSummary] Unexpected error:', err);
    return { error: '매출 합계 조회 중 오류가 발생했습니다.' };
  }
}

/**
 * 월별 매출 합계
 */
export async function getMonthlyRevenueSummary(
  year: number,
  month: number
): Promise<ActionResult<{ total_amount: number; count: number }>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: '인증이 필요합니다.' };
    }

    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDate = new Date(year, month, 0).toISOString().split('T')[0]; // 월 마지막 날

    const { data, error } = await supabase
      .from('revenue_records')
      .select('confirmed_amount')
      .eq('user_id', user.id)
      .gte('confirmed_at', startDate)
      .lte('confirmed_at', endDate);

    if (error) {
      console.error('[getMonthlyRevenueSummary] Supabase error:', error);
      return { error: error.message };
    }

    const total = data?.reduce((sum, record) => sum + record.confirmed_amount, 0) ?? 0;

    return { data: { total_amount: total, count: data?.length ?? 0 } };
  } catch (err) {
    console.error('[getMonthlyRevenueSummary] Unexpected error:', err);
    return { error: '월별 매출 합계 조회 중 오류가 발생했습니다.' };
  }
}

// ============================================================================
// 매입 (Cost) Actions
// ============================================================================

export interface GetCostParams {
  purchaseOrderId?: string;
  orderId?: string;
  startDate?: string; // ISO date
  endDate?: string; // ISO date
  page?: number;
  limit?: number;
}

/**
 * 매입 목록 조회 (기간 필터, 페이지네이션)
 */
export async function getCostRecords(
  params: GetCostParams = {}
): Promise<ActionResult<CostRow[]>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: '인증이 필요합니다.' };
    }

    const { purchaseOrderId, orderId, startDate, endDate, page = 1, limit = 20 } = params;
    const offset = (page - 1) * limit;

    let query = supabase
      .from('cost_records')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id);

    if (purchaseOrderId) {
      query = query.eq('purchase_order_id', purchaseOrderId);
    }

    if (orderId) {
      query = query.eq('order_id', orderId);
    }

    if (startDate) {
      query = query.gte('confirmed_at', startDate);
    }

    if (endDate) {
      query = query.lte('confirmed_at', endDate);
    }

    query = query.order('confirmed_at', { ascending: false }).range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('[getCostRecords] Supabase error:', error);
      return { error: error.message };
    }

    return { data: data ?? [], count: count ?? 0 };
  } catch (err) {
    console.error('[getCostRecords] Unexpected error:', err);
    return { error: '매입 목록 조회 중 오류가 발생했습니다.' };
  }
}

/**
 * 매입 확정 기록 생성
 */
export async function createCostRecord(formData: CostFormData): Promise<ActionResult<CostRow>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: '인증이 필요합니다.' };
    }

    const parsed = costFormSchema.safeParse(formData);
    if (!parsed.success) {
      return { error: '입력 값이 유효하지 않습니다.' };
    }

    const insertData: CostInsert = {
      user_id: user.id,
      purchase_order_id: parsed.data.purchase_order_id ?? null,
      order_id: parsed.data.order_id ?? null,
      confirmed_amount: parsed.data.confirmed_amount,
      confirmed_at: parsed.data.confirmed_at ?? null,
      payment_date: parsed.data.payment_date ?? null,
      payment_method: parsed.data.payment_method ?? null,
      memo: parsed.data.memo ?? null,
    };

    const { data, error } = await supabase
      .from('cost_records')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('[createCostRecord] Insert error:', error);
      return { error: error.message };
    }

    revalidatePath('/finance');
    return { data };
  } catch (err) {
    console.error('[createCostRecord] Unexpected error:', err);
    return { error: '매입 확정 기록 생성 중 오류가 발생했습니다.' };
  }
}

/**
 * 매입 기록 삭제
 */
export async function deleteCostRecord(id: string): Promise<ActionResult<void>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: '인증이 필요합니다.' };
    }

    const { error } = await supabase
      .from('cost_records')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('[deleteCostRecord] Delete error:', error);
      return { error: error.message };
    }

    revalidatePath('/finance');
    return { data: undefined };
  } catch (err) {
    console.error('[deleteCostRecord] Unexpected error:', err);
    return { error: '매입 기록 삭제 중 오류가 발생했습니다.' };
  }
}

/**
 * 특정 발주의 매입 이력 조회
 */
export async function getCostByPurchaseOrder(
  purchaseOrderId: string
): Promise<ActionResult<CostRow[]>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: '인증이 필요합니다.' };
    }

    const { data, error } = await supabase
      .from('cost_records')
      .select('*')
      .eq('user_id', user.id)
      .eq('purchase_order_id', purchaseOrderId)
      .order('confirmed_at', { ascending: false });

    if (error) {
      console.error('[getCostByPurchaseOrder] Supabase error:', error);
      return { error: error.message };
    }

    return { data: data ?? [] };
  } catch (err) {
    console.error('[getCostByPurchaseOrder] Unexpected error:', err);
    return { error: '발주별 매입 이력 조회 중 오류가 발생했습니다.' };
  }
}

/**
 * 기간별 매입 합계
 */
export async function getCostSummary(
  period: FinanceSummaryPeriod,
  year: number
): Promise<
  ActionResult<
    Array<{
      period: string;
      total_amount: number;
      count: number;
    }>
  >
> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: '인증이 필요합니다.' };
    }

    const startDate = `${year}-01-01`;
    const endDate = `${year}-12-31`;

    const { data, error } = await supabase
      .from('cost_records')
      .select('confirmed_at, confirmed_amount')
      .eq('user_id', user.id)
      .gte('confirmed_at', startDate)
      .lte('confirmed_at', endDate)
      .order('confirmed_at');

    if (error) {
      console.error('[getCostSummary] Supabase error:', error);
      return { error: error.message };
    }

    // 클라이언트 측 집계
    const summary = new Map<string, { total: number; count: number }>();

    data?.forEach((record) => {
      if (!record.confirmed_at) return;

      const date = new Date(record.confirmed_at);
      let key = '';

      if (period === 'monthly') {
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      } else if (period === 'quarterly') {
        const quarter = Math.floor(date.getMonth() / 3) + 1;
        key = `${date.getFullYear()}-Q${quarter}`;
      } else {
        key = `${date.getFullYear()}`;
      }

      const existing = summary.get(key) ?? { total: 0, count: 0 };
      summary.set(key, {
        total: existing.total + record.confirmed_amount,
        count: existing.count + 1,
      });
    });

    const result = Array.from(summary.entries()).map(([period, { total, count }]) => ({
      period,
      total_amount: total,
      count,
    }));

    return { data: result };
  } catch (err) {
    console.error('[getCostSummary] Unexpected error:', err);
    return { error: '매입 합계 조회 중 오류가 발생했습니다.' };
  }
}

/**
 * 월별 매입 합계
 */
export async function getMonthlyCostSummary(
  year: number,
  month: number
): Promise<ActionResult<{ total_amount: number; count: number }>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: '인증이 필요합니다.' };
    }

    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDate = new Date(year, month, 0).toISOString().split('T')[0]; // 월 마지막 날

    const { data, error } = await supabase
      .from('cost_records')
      .select('confirmed_amount')
      .eq('user_id', user.id)
      .gte('confirmed_at', startDate)
      .lte('confirmed_at', endDate);

    if (error) {
      console.error('[getMonthlyCostSummary] Supabase error:', error);
      return { error: error.message };
    }

    const total = data?.reduce((sum, record) => sum + record.confirmed_amount, 0) ?? 0;

    return { data: { total_amount: total, count: data?.length ?? 0 } };
  } catch (err) {
    console.error('[getMonthlyCostSummary] Unexpected error:', err);
    return { error: '월별 매입 합계 조회 중 오류가 발생했습니다.' };
  }
}

// ============================================================================
// 손익 (Profit/Loss) Actions
// ============================================================================

export interface ProfitLossSummary {
  revenue: number;
  cost: number;
  profit: number;
  profit_margin: number; // %
}

/**
 * 기간별 손익 조회
 */
export async function getProfitLossSummary(
  startDate: string,
  endDate: string
): Promise<ActionResult<ProfitLossSummary>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: '인증이 필요합니다.' };
    }

    // 매출 합계
    const { data: revenueData, error: revenueError } = await supabase
      .from('revenue_records')
      .select('confirmed_amount')
      .eq('user_id', user.id)
      .gte('confirmed_at', startDate)
      .lte('confirmed_at', endDate);

    if (revenueError) {
      console.error('[getProfitLossSummary] Revenue error:', revenueError);
      return { error: revenueError.message };
    }

    // 매입 합계
    const { data: costData, error: costError } = await supabase
      .from('cost_records')
      .select('confirmed_amount')
      .eq('user_id', user.id)
      .gte('confirmed_at', startDate)
      .lte('confirmed_at', endDate);

    if (costError) {
      console.error('[getProfitLossSummary] Cost error:', costError);
      return { error: costError.message };
    }

    const revenue = revenueData?.reduce((sum, r) => sum + r.confirmed_amount, 0) ?? 0;
    const cost = costData?.reduce((sum, c) => sum + c.confirmed_amount, 0) ?? 0;
    const profit = revenue - cost;
    const profit_margin = revenue > 0 ? (profit / revenue) * 100 : 0;

    return {
      data: {
        revenue,
        cost,
        profit,
        profit_margin: Math.round(profit_margin * 100) / 100, // 소수점 2자리
      },
    };
  } catch (err) {
    console.error('[getProfitLossSummary] Unexpected error:', err);
    return { error: '손익 조회 중 오류가 발생했습니다.' };
  }
}
