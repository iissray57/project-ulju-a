'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  ClipboardList,
  Calendar,
  Package,
  ShoppingCart,
  DollarSign,
  FileText,
  Settings,
  ChevronLeft,
  ChevronRight,
  Box,
  PencilRuler,
  LayoutGrid,
  Users,
  Boxes,
  Building2,
  MessageSquareText,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

const navItems = [
  { href: '/', label: '대시보드', icon: Home },
  { href: '/customers', label: '고객관리', icon: Users },
  { href: '/orders', label: '주문관리', icon: ClipboardList },
  { href: '/quote-requests', label: '견적요청', icon: MessageSquareText },
  { href: '/schedule', label: '스케줄', icon: Calendar },
  { href: '/products', label: '품목관리', icon: Boxes },
  { href: '/inventory', label: '재고관리', icon: Package },
  { href: '/purchases', label: '발주관리', icon: ShoppingCart },
  { href: '/suppliers', label: '거래처', icon: Building2 },
  { href: '/finance', label: '매출/매입', icon: DollarSign },
  { href: '/reports', label: '리포트', icon: FileText },
];

const modelingItems = [
  { href: '/closet/presets', label: '프리셋 관리', icon: Box },
  { href: '/closet/editor', label: '2D 에디터', icon: PencilRuler },
  { href: '/closet/model/new-v2', label: '2D 에디터 V2', icon: LayoutGrid },
];

const bottomNavItems = [
  { href: '/settings', label: '설정', icon: Settings },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        'hidden lg:flex flex-col border-r border-border bg-sidebar text-sidebar-foreground transition-all duration-300',
        collapsed ? 'w-16' : 'w-60'
      )}
    >
      {/* Logo + Toggle */}
      <div className="flex h-14 items-center justify-between px-4">
        {!collapsed ? (
          <span className="text-lg font-bold tracking-tight">울주앵글</span>
        ) : (
          <span className="text-lg font-bold">UA</span>
        )}
        <Button variant="ghost" size="icon" onClick={onToggle} className="h-7 w-7 shrink-0">
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>

      <Separator />

      {/* Nav items */}
      <nav className="flex-1 space-y-1 px-2 py-3">
        {navItems.map((item) => {
          const isActive = pathname === item.href ||
            (item.href !== '/' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground',
                collapsed && 'justify-center px-2'
              )}
              title={collapsed ? item.label : undefined}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}

        {/* 모델링 Section */}
        {!collapsed && (
          <div className="px-3 py-2">
            <h3 className="text-xs font-semibold text-sidebar-foreground/50 uppercase tracking-wider">
              모델링
            </h3>
          </div>
        )}
        {modelingItems.map((item) => {
          const isActive = pathname === item.href ||
            (item.href !== '/' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground',
                collapsed && 'justify-center px-2'
              )}
              title={collapsed ? item.label : undefined}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <Separator />

      {/* Bottom section */}
      <div className="space-y-1 px-2 py-3">
        {bottomNavItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground',
                collapsed && 'justify-center px-2'
              )}
              title={collapsed ? item.label : undefined}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}


      </div>
    </aside>
  );
}
