import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '오프라인 - 울주앵글',
  description: '오프라인 모드',
};

export default function OfflineLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
