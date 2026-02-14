import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ClosetBiz - 옷장 업무 관리',
  description: '앵글/시스템 옷장 설치 1인 사업자 업무 관리 시스템',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
