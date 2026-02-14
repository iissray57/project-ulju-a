'use client';

import type { ReactNode } from 'react';
import type { ViewType } from '@/lib/types/views';

interface ViewContainerProps {
  currentView: ViewType;
  views: Partial<Record<ViewType, ReactNode>>;
  fallback?: ReactNode;
}

export function ViewContainer({
  currentView,
  views,
  fallback,
}: ViewContainerProps) {
  const content = views[currentView];

  if (!content) {
    return fallback ? <>{fallback}</> : null;
  }

  return <>{content}</>;
}
