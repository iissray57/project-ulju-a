import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '오프라인',
  description: '오프라인 모드',
};

export default function OfflinePage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-foreground">오프라인 모드</h1>
        <p className="mt-4 text-muted-foreground">
          인터넷 연결이 끊어졌습니다.
          <br />
          연결을 확인한 후 다시 시도해주세요.
        </p>
      </div>
    </div>
  );
}
