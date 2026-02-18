/**
 * API Route for Installation Reminder Cron Job
 * 매일 오전 9시에 실행되도록 외부 cron 서비스(예: Vercel Cron)에서 호출
 */

import { NextResponse } from 'next/server';
import { runInstallationReminderJob } from '@/lib/cron/installation-reminder';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: Request) {
  // 보안: Authorization 헤더 검증 (선택적)
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await runInstallationReminderJob();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Cron job failed:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
