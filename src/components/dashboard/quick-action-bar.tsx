import Link from 'next/link';
import { Plus, UserPlus, Calendar, Package } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface QuickActionProps {
  href: string;
  icon: React.ReactNode;
  label: string;
}

function QuickActionButton({ href, icon, label }: QuickActionProps) {
  return (
    <Link
      href={href}
      className="flex flex-col items-center gap-2 p-4 rounded-lg border bg-card hover:bg-accent transition-colors"
    >
      <div className="p-2 rounded-full bg-primary/10 text-primary">{icon}</div>
      <span className="text-sm font-medium text-center">{label}</span>
    </Link>
  );
}

export function QuickActionBar() {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <QuickActionButton
            href="/orders/new"
            icon={<Plus className="h-5 w-5" />}
            label="신규 주문 등록"
          />
          <QuickActionButton
            href="/customers/new"
            icon={<UserPlus className="h-5 w-5" />}
            label="고객 등록"
          />
          <QuickActionButton
            href="/schedule"
            icon={<Calendar className="h-5 w-5" />}
            label="일정 관리"
          />
          <QuickActionButton
            href="/inventory"
            icon={<Package className="h-5 w-5" />}
            label="재고 관리"
          />
        </div>
      </CardContent>
    </Card>
  );
}
