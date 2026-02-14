'use client';

import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ui/theme-toggle';

interface HeaderProps {
  onMenuClick?: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  return (
    <header className="flex h-14 items-center gap-4 border-b border-border bg-background px-4 lg:px-6">
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={onMenuClick}
        aria-label="메뉴 열기"
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* Mobile logo */}
      <span className="text-lg font-bold lg:hidden">ClosetBiz</span>

      {/* Spacer */}
      <div className="flex-1" />

      <ThemeToggle />
    </header>
  );
}
