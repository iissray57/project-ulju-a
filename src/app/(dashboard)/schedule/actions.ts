'use server';

import { createClient } from '@/lib/supabase/server';
import type { Database, TablesInsert, TablesUpdate } from '@/lib/database.types';
import { scheduleFormSchema, type ScheduleFormData } from '@/lib/schemas/schedule';
import { revalidatePath } from 'next/cache';

type ScheduleRow = Database['public']['Tables']['schedules']['Row'];
type ScheduleInsert = TablesInsert<'schedules'>;
type ScheduleUpdate = TablesUpdate<'schedules'>;

// 공통 결과 타입
export interface ActionResult<T = unknown> {
  data?: T;
  error?: string;
  count?: number;
}

// 스케줄 with order 정보
export interface ScheduleWithOrder extends ScheduleRow {
  order: {
    id: string;
    order_number: string;
    customer_id: string;
  } | null;
}

// 목록 조회 파라미터
export interface GetSchedulesParams {
  startDate?: string; // ISO date
  endDate?: string; // ISO date
  type?: string;
  isActive?: boolean;
  orderId?: string;
  page?: number;
  limit?: number;
}

/**
 * 스케줄 목록 조회 (날짜 범위, 유형, is_active 필터)
 */
export async function getSchedules(
  params: GetSchedulesParams = {}
): Promise<ActionResult<ScheduleWithOrder[]>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: '인증이 필요합니다.' };
    }

    const {
      startDate,
      endDate,
      type,
      isActive = true,
      orderId,
      page = 1,
      limit = 20,
    } = params;
    const offset = (page - 1) * limit;

    // 쿼리 빌드
    let query = supabase
      .from('schedules')
      .select(
        `
        *,
        order:orders(id, order_number, customer_id)
      `,
        { count: 'exact' }
      )
      .eq('user_id', user.id);

    // is_active 필터
    query = query.eq('is_active', isActive);

    // 날짜 범위 필터
    if (startDate) {
      query = query.gte('scheduled_date', startDate);
    }
    if (endDate) {
      query = query.lte('scheduled_date', endDate);
    }

    // 유형 필터
    if (type) {
      query = query.eq('type', type);
    }

    // 주문 ID 필터
    if (orderId) {
      query = query.eq('order_id', orderId);
    }

    // 정렬: 날짜 ASC, 시간 ASC, 생성일 ASC
    query = query
      .order('scheduled_date', { ascending: true })
      .order('scheduled_time', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: true });

    // 페이지네이션
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('[getSchedules] Supabase error:', error);
      return { error: error.message };
    }

    return { data: data as ScheduleWithOrder[], count: count ?? 0 };
  } catch (err) {
    console.error('[getSchedules] Unexpected error:', err);
    return { error: '스케줄 목록 조회 중 오류가 발생했습니다.' };
  }
}

/**
 * 단건 조회 (order 정보 join)
 */
export async function getSchedule(
  id: string
): Promise<ActionResult<ScheduleWithOrder>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: '인증이 필요합니다.' };
    }

    const { data, error } = await supabase
      .from('schedules')
      .select(
        `
        *,
        order:orders(id, order_number, customer_id)
      `
      )
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (error) {
      console.error('[getSchedule] Supabase error:', error);
      return { error: error.message };
    }

    if (!data) {
      return { error: '스케줄을 찾을 수 없습니다.' };
    }

    return { data: data as ScheduleWithOrder };
  } catch (err) {
    console.error('[getSchedule] Unexpected error:', err);
    return { error: '스케줄 조회 중 오류가 발생했습니다.' };
  }
}

/**
 * 스케줄 생성
 */
export async function createSchedule(
  formData: ScheduleFormData
): Promise<ActionResult<ScheduleRow>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: '인증이 필요합니다.' };
    }

    // 입력 검증
    const parsed = scheduleFormSchema.safeParse(formData);
    if (!parsed.success) {
      return { error: '입력 값이 유효하지 않습니다.' };
    }

    // INSERT
    const insertData: ScheduleInsert = {
      user_id: user.id,
      order_id: parsed.data.order_id ?? null,
      type: parsed.data.type,
      title: parsed.data.title,
      scheduled_date: parsed.data.scheduled_date,
      scheduled_time: parsed.data.scheduled_time ?? null,
      duration_minutes: parsed.data.duration_minutes ?? null,
      location: parsed.data.location ?? null,
      memo: parsed.data.memo ?? null,
      is_active: parsed.data.is_active,
    };

    const { data, error } = await supabase
      .from('schedules')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('[createSchedule] Insert error:', error);
      return { error: error.message };
    }

    revalidatePath('/schedule');
    return { data };
  } catch (err) {
    console.error('[createSchedule] Unexpected error:', err);
    return { error: '스케줄 생성 중 오류가 발생했습니다.' };
  }
}

/**
 * 스케줄 수정
 */
export async function updateSchedule(
  id: string,
  formData: Partial<ScheduleFormData>
): Promise<ActionResult<ScheduleRow>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: '인증이 필요합니다.' };
    }

    // 부분 입력 검증
    const parsed = scheduleFormSchema.partial().safeParse(formData);
    if (!parsed.success) {
      return { error: '입력 값이 유효하지 않습니다.' };
    }

    // UPDATE
    const updateData: ScheduleUpdate = {
      ...(parsed.data.order_id !== undefined && {
        order_id: parsed.data.order_id ?? null,
      }),
      ...(parsed.data.type && { type: parsed.data.type }),
      ...(parsed.data.title && { title: parsed.data.title }),
      ...(parsed.data.scheduled_date && { scheduled_date: parsed.data.scheduled_date }),
      ...(parsed.data.scheduled_time !== undefined && {
        scheduled_time: parsed.data.scheduled_time ?? null,
      }),
      ...(parsed.data.duration_minutes !== undefined && {
        duration_minutes: parsed.data.duration_minutes ?? null,
      }),
      ...(parsed.data.location !== undefined && {
        location: parsed.data.location ?? null,
      }),
      ...(parsed.data.memo !== undefined && { memo: parsed.data.memo ?? null }),
      ...(parsed.data.is_active !== undefined && { is_active: parsed.data.is_active }),
    };

    const { data, error } = await supabase
      .from('schedules')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      console.error('[updateSchedule] Update error:', error);
      return { error: error.message };
    }

    if (!data) {
      return { error: '스케줄을 찾을 수 없습니다.' };
    }

    revalidatePath('/schedule');
    revalidatePath(`/schedule/${id}`);
    return { data };
  } catch (err) {
    console.error('[updateSchedule] Unexpected error:', err);
    return { error: '스케줄 수정 중 오류가 발생했습니다.' };
  }
}

/**
 * 스케줄 삭제 (soft delete - is_active = false)
 */
export async function deleteSchedule(id: string): Promise<ActionResult<void>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: '인증이 필요합니다.' };
    }

    // soft delete: is_active = false
    const { error } = await supabase
      .from('schedules')
      .update({ is_active: false })
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('[deleteSchedule] Update error:', error);
      return { error: error.message };
    }

    revalidatePath('/schedule');
    return { data: undefined };
  } catch (err) {
    console.error('[deleteSchedule] Unexpected error:', err);
    return { error: '스케줄 삭제 중 오류가 발생했습니다.' };
  }
}

/**
 * 완료 토글
 */
export async function toggleScheduleCompleted(
  id: string
): Promise<ActionResult<ScheduleRow>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: '인증이 필요합니다.' };
    }

    // 현재 상태 조회
    const { data: schedule, error: fetchError } = await supabase
      .from('schedules')
      .select('is_completed')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !schedule) {
      console.error('[toggleScheduleCompleted] Fetch error:', fetchError);
      return { error: '스케줄을 찾을 수 없습니다.' };
    }

    // 토글
    const { data, error } = await supabase
      .from('schedules')
      .update({ is_completed: !schedule.is_completed })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      console.error('[toggleScheduleCompleted] Update error:', error);
      return { error: error.message };
    }

    revalidatePath('/schedule');
    revalidatePath(`/schedule/${id}`);
    return { data };
  } catch (err) {
    console.error('[toggleScheduleCompleted] Unexpected error:', err);
    return { error: '완료 상태 변경 중 오류가 발생했습니다.' };
  }
}

/**
 * 특정 날짜의 일정 (대시보드용)
 */
export async function getSchedulesByDate(
  date: string
): Promise<ActionResult<ScheduleWithOrder[]>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: '인증이 필요합니다.' };
    }

    const { data, error } = await supabase
      .from('schedules')
      .select(
        `
        *,
        order:orders(id, order_number, customer_id)
      `
      )
      .eq('user_id', user.id)
      .eq('scheduled_date', date)
      .eq('is_active', true)
      .order('scheduled_time', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: true });

    if (error) {
      console.error('[getSchedulesByDate] Supabase error:', error);
      return { error: error.message };
    }

    return { data: data as ScheduleWithOrder[] };
  } catch (err) {
    console.error('[getSchedulesByDate] Unexpected error:', err);
    return { error: '날짜별 스케줄 조회 중 오류가 발생했습니다.' };
  }
}
