import type { LucideIcon } from 'lucide-react';

export type ViewType =
  | 'kanban'
  | 'list'
  | 'grid'
  | 'timeline'
  | 'calendar'
  | 'agenda'
  | 'weekly'
  | 'map'
  | 'summary';

export interface ViewConfig {
  type: ViewType;
  label: string;
  icon: LucideIcon;
  defaultForBreakpoint: {
    mobile?: boolean;
    tablet?: boolean;
    desktop?: boolean;
  };
}
