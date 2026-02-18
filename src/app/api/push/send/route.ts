import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import webpush from 'web-push';

export async function POST(request: Request) {
  const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;
  const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY!;

  if (vapidPublicKey && vapidPrivateKey) {
    webpush.setVapidDetails(
      'mailto:admin@closetbiz.com',
      vapidPublicKey,
      vapidPrivateKey
    );
  }
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userId, title, body, data } = await request.json();

    if (!userId || !title || !body) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // 권한 검증: 본인에게만 알림 전송 가능
    if (userId !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden: Can only send notifications to yourself' },
        { status: 403 }
      );
    }

    // Get user subscriptions
    const { data: subscriptions, error: fetchError } = await supabase
      .from('push_subscriptions')
      .select('endpoint, p256dh, auth')
      .eq('user_id', userId);

    if (fetchError) {
      return NextResponse.json(
        { error: fetchError.message },
        { status: 500 }
      );
    }

    if (!subscriptions || subscriptions.length === 0) {
      return NextResponse.json(
        { error: 'No subscriptions found' },
        { status: 404 }
      );
    }

    const payload = JSON.stringify({ title, body, data });

    const results = await Promise.allSettled(
      subscriptions.map((sub) =>
        webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh,
              auth: sub.auth,
            },
          },
          payload
        )
      )
    );

    const successCount = results.filter((r) => r.status === 'fulfilled').length;
    const failureCount = results.filter((r) => r.status === 'rejected').length;

    return NextResponse.json({
      success: true,
      sent: successCount,
      failed: failureCount,
    });
  } catch (error) {
    console.error('Send push error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
