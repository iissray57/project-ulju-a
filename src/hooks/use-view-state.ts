'use client';

import { useState, useEffect, useCallback } from 'react';
import type { ViewType } from '@/lib/types/views';

type Breakpoint = 'mobile' | 'tablet' | 'desktop';

interface UseViewStateOptions {
  storageKey: string;
  defaultView: Record<Breakpoint, ViewType>;
  availableViews: ViewType[];
}

function getBreakpoint(): Breakpoint {
  if (typeof window === 'undefined') return 'desktop';
  const width = window.innerWidth;
  if (width < 768) return 'mobile';
  if (width < 1024) return 'tablet';
  return 'desktop';
}

export function useViewState({
  storageKey,
  defaultView,
  availableViews,
}: UseViewStateOptions) {
  const [breakpoint, setBreakpoint] = useState<Breakpoint>('desktop');
  const [view, setViewState] = useState<ViewType>(() => {
    if (typeof window === 'undefined') return defaultView.desktop;
    const saved = localStorage.getItem(storageKey);
    if (saved && availableViews.includes(saved as ViewType)) {
      return saved as ViewType;
    }
    return defaultView[getBreakpoint()];
  });

  useEffect(() => {
    const handleResize = () => {
      const newBreakpoint = getBreakpoint();
      setBreakpoint(newBreakpoint);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Set default view based on breakpoint if no saved preference
  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (!saved) {
      setViewState(defaultView[breakpoint]);
    }
  }, [breakpoint, defaultView, storageKey]);

  const setView = useCallback(
    (newView: ViewType) => {
      if (availableViews.includes(newView)) {
        setViewState(newView);
        localStorage.setItem(storageKey, newView);
      }
    },
    [availableViews, storageKey]
  );

  return { view, setView, breakpoint };
}
