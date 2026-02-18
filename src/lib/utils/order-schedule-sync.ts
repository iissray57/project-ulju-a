import { createClient } from '@/lib/supabase/server';
import type { Database } from '@/lib/database.types';
import type { OrderStatus } from '@/lib/schemas/order-status';

type ScheduleType = Database['public']['Enums']['schedule_type'];

interface OrderData {
  order_number: string;
  customer_id?: string;
  measurement_date?: string | null;
  installation_date?: string | null;
  site_address?: string | null;
}

interface DateSyncData {
  order_number: string;
  measurement_date?: string | null;
  installation_date?: string | null;
  site_address?: string | null;
}

/**
 * 주문 상태 변경 시 관련 스케줄 자동 생성
 *
 * 연동 규칙:
 * - measurement 전이 → measurement 스케줄 생성 (실측일이 있으면 해당 날짜로)
 * - confirmed 전이 → installation 스케줄 생성 (설치일이 있으면 해당 날짜로)
 *
 * 중복 방지: 동일 order_id + type + is_active=true 스케줄이 이미 있으면 생성 안 함
 */
export async function syncOrderSchedule(
  orderId: string,
  newStatus: OrderStatus,
  orderData: OrderData
): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    console.warn('[syncOrderSchedule] No authenticated user');
    return;
  }

  // inquiry 상태에서 measurement 스케줄 생성 (실측일이 있으면)
  if (newStatus === 'inquiry' && orderData.measurement_date) {
    const { data: existing } = await supabase
      .from('schedules')
      .select('id')
      .eq('order_id', orderId)
      .eq('type', 'measurement')
      .eq('is_active', true)
      .maybeSingle();

    if (!existing) {
      const { error } = await supabase.from('schedules').insert({
        user_id: user.id,
        order_id: orderId,
        type: 'measurement',
        title: `실측 - ${orderData.order_number}`,
        scheduled_date: orderData.measurement_date,
        location: orderData.site_address || undefined,
      });

      if (error) {
        console.error('[syncOrderSchedule] Failed to create measurement schedule:', error);
      }
    }
  }

  // quotation 전이 시: installation 스케줄 생성 (설치일이 있으면)
  if (newStatus === 'quotation' && orderData.installation_date) {
    const { data: existing } = await supabase
      .from('schedules')
      .select('id')
      .eq('order_id', orderId)
      .eq('type', 'installation')
      .eq('is_active', true)
      .maybeSingle();

    if (!existing) {
      const { error } = await supabase.from('schedules').insert({
        user_id: user.id,
        order_id: orderId,
        type: 'installation',
        title: `설치 - ${orderData.order_number}`,
        scheduled_date: orderData.installation_date,
        location: orderData.site_address || undefined,
      });

      if (error) {
        console.error('[syncOrderSchedule] Failed to create installation schedule:', error);
      }
    }
  }
}

/**
 * 주문 수정 시 날짜 변경에 따른 스케줄 동기화
 *
 * - 날짜가 새로 입력되면: 기존 스케줄이 없으면 생성, 있으면 날짜 업데이트
 * - 날짜가 삭제되면: 기존 스케줄 비활성화 (is_active = false)
 */
export async function syncOrderDateChange(
  orderId: string,
  data: DateSyncData
): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    console.warn('[syncOrderDateChange] No authenticated user');
    return;
  }

  // 실측일 처리
  await syncScheduleForDate(
    supabase,
    user.id,
    orderId,
    'measurement',
    data.measurement_date,
    `실측 - ${data.order_number}`,
    data.site_address
  );

  // 설치일 처리
  await syncScheduleForDate(
    supabase,
    user.id,
    orderId,
    'installation',
    data.installation_date,
    `설치 - ${data.order_number}`,
    data.site_address
  );
}

/**
 * 특정 타입의 스케줄 동기화 (생성/수정/비활성화)
 */
async function syncScheduleForDate(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  orderId: string,
  type: ScheduleType,
  date: string | null | undefined,
  title: string,
  location: string | null | undefined
): Promise<void> {
  // 기존 활성 스케줄 조회
  const { data: existing } = await supabase
    .from('schedules')
    .select('id, scheduled_date')
    .eq('order_id', orderId)
    .eq('type', type)
    .eq('is_active', true)
    .maybeSingle();

  if (date) {
    // 날짜가 있는 경우
    if (existing) {
      // 기존 스케줄 날짜가 다르면 업데이트
      if (existing.scheduled_date !== date) {
        const { error } = await supabase
          .from('schedules')
          .update({
            scheduled_date: date,
            location: location || undefined,
          })
          .eq('id', existing.id);

        if (error) {
          console.error(`[syncScheduleForDate] Failed to update ${type} schedule:`, error);
        }
      }
    } else {
      // 새 스케줄 생성
      const { error } = await supabase.from('schedules').insert({
        user_id: userId,
        order_id: orderId,
        type,
        title,
        scheduled_date: date,
        location: location || undefined,
      });

      if (error) {
        console.error(`[syncScheduleForDate] Failed to create ${type} schedule:`, error);
      }
    }
  } else {
    // 날짜가 없는 경우 (삭제됨) - 기존 스케줄 비활성화
    if (existing) {
      const { error } = await supabase
        .from('schedules')
        .update({ is_active: false })
        .eq('id', existing.id);

      if (error) {
        console.error(`[syncScheduleForDate] Failed to deactivate ${type} schedule:`, error);
      }
    }
  }
}
