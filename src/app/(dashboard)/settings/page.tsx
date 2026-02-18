import Link from 'next/link';
import { Bell, Image } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const settingsItems = [
  {
    href: '/settings/portfolios',
    icon: Image,
    title: '포트폴리오 관리',
    description: '랜딩페이지에 표시할 시공 사례를 관리합니다.',
  },
  {
    href: '/settings/notifications',
    icon: Bell,
    title: '알림 설정',
    description: '푸시 알림을 관리하고 설정합니다.',
  },
];

export default function SettingsPage() {
  return (
    <div className="container max-w-4xl py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">설정</h1>
        <p className="text-muted-foreground mt-2">
          앱 설정을 관리합니다.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {settingsItems.map((item) => (
          <Link key={item.href} href={item.href}>
            <Card className="h-full transition-colors hover:bg-accent">
              <CardHeader className="flex flex-row items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <item.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-base">{item.title}</CardTitle>
                  <CardDescription className="text-sm">
                    {item.description}
                  </CardDescription>
                </div>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
