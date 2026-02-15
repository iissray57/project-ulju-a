'use client';

import { useEffect, useState } from 'react';

export default function OfflinePage() {
  const [isOnline, setIsOnline] = useState(false);
  const [lastOnline, setLastOnline] = useState<string | null>(null);

  useEffect(() => {
    // 브라우저 온라인 상태 확인
    setIsOnline(navigator.onLine);

    // 마지막 온라인 시간 로드
    const storedTime = localStorage.getItem('lastOnlineTime');
    if (storedTime) {
      const date = new Date(storedTime);
      setLastOnline(
        date.toLocaleString('ko-KR', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })
      );
    }

    // 온라인 상태 변경 감지
    const handleOnline = () => {
      setIsOnline(true);
      const now = new Date().toISOString();
      localStorage.setItem('lastOnlineTime', now);
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleRetry = () => {
    if (navigator.onLine) {
      window.location.reload();
    } else {
      alert('아직 인터넷 연결이 없습니다. 잠시 후 다시 시도해주세요.');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md text-center">
        {/* 로고/아이콘 영역 */}
        <div className="mb-8 flex justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
            <svg
              className="h-10 w-10 text-muted-foreground"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414"
              />
            </svg>
          </div>
        </div>

        {/* 메인 메시지 */}
        <h1 className="mb-4 text-3xl font-bold text-foreground">
          오프라인 상태입니다
        </h1>

        <p className="mb-6 text-lg text-muted-foreground">
          인터넷 연결이 끊어졌습니다.
          <br />
          연결을 확인한 후 다시 시도해주세요.
        </p>

        {/* 마지막 온라인 시간 */}
        {lastOnline && (
          <p className="mb-8 text-sm text-muted-foreground">
            마지막 온라인: {lastOnline}
          </p>
        )}

        {/* 상태 표시 */}
        <div className="mb-8 flex items-center justify-center gap-2">
          <div
            className={`h-3 w-3 rounded-full ${
              isOnline ? 'bg-green-500' : 'bg-red-500'
            }`}
          />
          <span className="text-sm text-muted-foreground">
            {isOnline ? '온라인' : '오프라인'}
          </span>
        </div>

        {/* 다시 시도 버튼 */}
        <button
          onClick={handleRetry}
          className="w-full rounded-lg bg-primary px-6 py-3 font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
        >
          다시 시도
        </button>

        {/* 추가 정보 */}
        <p className="mt-8 text-xs text-muted-foreground">
          울주앵글은 오프라인에서도 일부 기능을 사용할 수 있습니다.
          <br />
          저장된 데이터는 온라인 상태가 되면 자동으로 동기화됩니다.
        </p>
      </div>
    </div>
  );
}
