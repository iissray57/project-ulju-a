import { createClient } from '@/lib/supabase/server';
import type { Database } from '@/lib/database.types';

type OrderStatus = Database['public']['Enums']['order_status'];

interface OrderData {
  order_number: string;
  customer_id?: string;
  measurement_date?: string | null;
  installation_date?: string | null;
  site_address?: string | null;
}

/**
 * 수주 상태 변경 시 관련 스케줄 자동 생성
 *
 * 연동 규칙:
 * - measurement_done 전이 → measurement 스케줄 생성 (실측일이 있으면 해당 날짜로)
 * - date_fixed 전이 → installation 스케줄 생성 (설치일이 있으면 해당 날짜로)
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

  // measurement_done 전이 시: measurement 스케줄 생성
  if (newStatus === 'measurement_done' && orderData.measurement_date) {
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

  // date_fixed 전이 시: installation 스케줄 생성
  if (newStatus === 'date_fixed' && orderData.installation_date) {
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
