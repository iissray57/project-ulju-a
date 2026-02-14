'use client';

import type { ViewConfig, ViewType } from '@/lib/types/views';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface ViewSwitcherProps {
  views: ViewConfig[];
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
  className?: string;
}

export function ViewSwitcher({
  views,
  currentView,
  onViewChange,
  className,
}: ViewSwitcherProps) {
  return (
    <div className={cn('flex items-center gap-1 rounded-md border border-border p-1', className)}>
      {views.map((viewConfig) => {
        const Icon = viewConfig.icon;
        const isActive = currentView === viewConfig.type;

        return (
          <Button
            key={viewConfig.type}
            variant={isActive ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => onViewChange(viewConfig.type)}
            className={cn(
              'h-8 gap-1.5 px-2.5 text-xs',
              isActive && 'bg-secondary'
            )}
            aria-label={`${viewConfig.label} 보기`}
            aria-pressed={isActive}
          >
            <Icon className="h-4 w-4" />
            <span className="hidden sm:inline">{viewConfig.label}</span>
          </Button>
        );
      })}
    </div>
  );
}
