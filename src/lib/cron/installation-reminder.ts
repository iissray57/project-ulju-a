/**
 * 설치일 D-1 알림 Cron Job
 * schedules.start_time 기준으로 내일 설치 예정인 주문의 생성자에게 푸시 알림
 */

import { createClient } from '@supabase/supabase-js';
import webpush from 'web-push';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// VAPID 설정 (환경변수가 있을 때만 초기화)
const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(
    'mailto:admin@closetbiz.com',
    vapidPublicKey,
    vapidPrivateKey
  );
}

interface TomorrowInstallation {
  orderId: string;
  orderNumber: string;
  customerName: string;
  createdBy: string;
  startTime: string;
}

/**
 * 내일 설치 예정인 주문 조회
 */
async function getTomorrowInstallations(): Promise<TomorrowInstallation[]> {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);

  const dayAfterTomorrow = new Date(tomorrow);
  dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);

  const { data, error } = await supabase
    .from('schedules')
    .select(
      `
      id,
      order_id,
      start_time,
      orders!inner(
        id,
        order_number,
        user_id,
        customers!inner(name)
      )
    `
    )
    .gte('start_time', tomorrow.toISOString())
    .lt('start_time', dayAfterTomorrow.toISOString())
    .eq('type', 'installation');

  if (error) {
    console.error('Failed to fetch tomorrow installations:', error);
    return [];
  }

  return (data || []).map((schedule: any) => ({
    orderId: schedule.orders.id,
    orderNumber: schedule.orders.order_number,
    customerName: schedule.orders.customers.name,
    createdBy: schedule.orders.user_id,
    startTime: schedule.start_time,
  }));
}

/**
 * 사용자의 푸시 구독 정보 조회
 */
async function getUserSubscriptions(userId: string) {
  const { data, error } = await supabase
    .from('push_subscriptions')
    .select('endpoint, p256dh, auth')
    .eq('user_id', userId);

  if (error) {
    console.error('Failed to fetch subscriptions:', error);
    return [];
  }

  return data || [];
}

/**
 * 푸시 알림 전송
 */
async function sendPushNotification(
  subscription: any,
  orderId: string,
  orderNumber: string,
  customerName: string
) {
  const payload = JSON.stringify({
    title: '내일 설치 예정',
    body: `${customerName} - ${orderNumber}`,
    data: {
      orderId,
      url: `/orders/${orderId}`,
    },
  });

  try {
    await webpush.sendNotification(
      {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscription.p256dh,
          auth: subscription.auth,
        },
      },
      payload
    );
    console.log(`Push notification sent for order ${orderNumber}`);
  } catch (error) {
    console.error('Failed to send push notification:', error);
  }
}

/**
 * Cron Job 실행 함수
 */
export async function runInstallationReminderJob() {
  console.log('Running installation reminder job...');

  const installations = await getTomorrowInstallations();
  console.log(`Found ${installations.length} installations for tomorrow`);

  for (const installation of installations) {
    const subscriptions = await getUserSubscriptions(installation.createdBy);

    for (const subscription of subscriptions) {
      await sendPushNotification(
        subscription,
        installation.orderId,
        installation.orderNumber,
        installation.customerName
      );
    }
  }

  console.log('Installation reminder job completed');
}
