'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, ClipboardList, Plus, Package, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

const tabs = [
  { href: '/', label: '홈', icon: Home },
  { href: '/orders', label: '수주', icon: ClipboardList },
  { href: '#add', label: '', icon: Plus, isFab: true },
  { href: '/inventory', label: '재고', icon: Package },
  { href: '/settings', label: '설정', icon: Settings },
];

export function BottomTabBar() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex h-16 items-center justify-around border-t border-border bg-background lg:hidden">
      {tabs.map((tab) => {
        const isActive = tab.href === '/'
          ? pathname === '/'
          : pathname.startsWith(tab.href);

        if (tab.isFab) {
          return (
            <button
              key={tab.href}
              className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg -mt-4"
              aria-label="빠른 추가"
            >
              <Plus className="h-6 w-6" />
            </button>
          );
        }

        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              'flex flex-col items-center gap-1 text-xs',
              isActive
                ? 'text-primary'
                : 'text-muted-foreground'
            )}
          >
            <tab.icon className="h-5 w-5" />
            <span>{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
