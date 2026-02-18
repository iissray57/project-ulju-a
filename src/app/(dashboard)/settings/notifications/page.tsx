'use client';

import { useState, useEffect } from 'react';
import { Bell, BellOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import {
  subscribeToPushNotifications,
  unsubscribeFromPushNotifications,
} from '@/lib/push/subscription';

export default function NotificationsSettingsPage() {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const { toast } = useToast();

  useEffect(() => {
    // Check notification permission
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }

    // Check if already subscribed
    checkSubscription();
  }, []);

  const checkSubscription = async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      return;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      setIsSubscribed(!!subscription);
    } catch (error) {
      console.error('Failed to check subscription:', error);
    }
  };

  const handleSubscribe = async () => {
    if (permission === 'denied') {
      toast({
        title: '알림 권한 거부됨',
        description: '브라우저 설정에서 알림 권한을 허용해주세요.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      // Request permission if needed
      if (permission === 'default') {
        const result = await Notification.requestPermission();
        setPermission(result);

        if (result === 'denied') {
          toast({
            title: '알림 권한 거부됨',
            description: '푸시 알림을 받으려면 권한을 허용해야 합니다.',
            variant: 'destructive',
          });
          return;
        }
      }

      const success = await subscribeToPushNotifications();

      if (success) {
        setIsSubscribed(true);
        toast({
          title: '알림 구독 완료',
          description: '푸시 알림을 받을 수 있습니다.',
        });
      } else {
        toast({
          title: '구독 실패',
          description: '알림 구독에 실패했습니다.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: '오류 발생',
        description: error instanceof Error ? error.message : '알 수 없는 오류',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnsubscribe = async () => {
    setIsLoading(true);

    try {
      const success = await unsubscribeFromPushNotifications();

      if (success) {
        setIsSubscribed(false);
        toast({
          title: '구독 해제 완료',
          description: '푸시 알림을 더 이상 받지 않습니다.',
        });
      } else {
        toast({
          title: '해제 실패',
          description: '구독 해제에 실패했습니다.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: '오류 발생',
        description: error instanceof Error ? error.message : '알 수 없는 오류',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const isSupported =
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window;

  return (
    <div className="container max-w-4xl py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">알림 설정</h1>
        <p className="text-muted-foreground mt-2">
          푸시 알림을 관리하고 설정합니다.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>푸시 알림</CardTitle>
          <CardDescription>
            설치 일정 등 중요한 알림을 받아보세요.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isSupported ? (
            <div className="text-sm text-muted-foreground">
              이 브라우저는 푸시 알림을 지원하지 않습니다.
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">푸시 알림</div>
                  <div className="text-sm text-muted-foreground">
                    {isSubscribed
                      ? '알림을 받고 있습니다'
                      : '알림을 받지 않고 있습니다'}
                  </div>
                </div>

                {isSubscribed ? (
                  <Button
                    variant="outline"
                    onClick={handleUnsubscribe}
                    disabled={isLoading}
                  >
                    <BellOff className="mr-2 h-4 w-4" />
                    구독 해제
                  </Button>
                ) : (
                  <Button onClick={handleSubscribe} disabled={isLoading}>
                    <Bell className="mr-2 h-4 w-4" />
                    알림 받기
                  </Button>
                )}
              </div>

              {permission === 'denied' && (
                <div className="rounded-md bg-destructive/10 p-4 text-sm text-destructive">
                  브라우저 설정에서 알림 권한이 차단되어 있습니다. 설정에서
                  권한을 허용해주세요.
                </div>
              )}

              <div className="space-y-2 text-sm text-muted-foreground">
                <h4 className="font-medium text-foreground">알림 내용</h4>
                <ul className="list-disc list-inside space-y-1">
                  <li>설치 일정 하루 전 알림 (오전 9시)</li>
                  <li>주문 상태 변경 알림 (선택 가능, 추후 추가)</li>
                </ul>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
