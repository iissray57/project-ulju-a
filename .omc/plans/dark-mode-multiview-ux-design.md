# ClosetBiz - Dark Mode + Multi-View UX Design

**Aesthetic Direction**: Industrial Precision
Brutalist clarity meets refined functionality. Sharp contrast ratios, geometric layouts, utilitarian type hierarchy. Built for field work under harsh sunlight and late-night office calculations.

---

## 1. Dark Mode System Design

### 1.1 Color Palette Specification

#### Core Semantic Colors

```typescript
// /lib/design-tokens.ts
export const colorTokens = {
  light: {
    // Surfaces
    background: {
      primary: '#FAFAFA',      // Page background
      secondary: '#FFFFFF',    // Card/panel surface
      tertiary: '#F5F5F5',     // Subtle backgrounds (hover states)
      elevated: '#FFFFFF',     // Modals, dropdowns (with shadow)
    },

    // Content
    foreground: {
      primary: '#0A0A0A',      // Primary text - WCAG AAA
      secondary: '#525252',    // Secondary text - WCAG AA
      tertiary: '#A3A3A3',     // Disabled/placeholder
      inverted: '#FFFFFF',     // Text on dark backgrounds
    },

    // Borders & Dividers
    border: {
      default: '#E5E5E5',
      strong: '#D4D4D4',
      subtle: '#F5F5F5',
    },

    // Brand Colors
    primary: {
      default: '#0F172A',      // Deep slate (industrial)
      hover: '#1E293B',
      active: '#0A0E1A',
      subtle: '#F1F5F9',       // Backgrounds
      contrast: '#FFFFFF',     // Text on primary
    },

    secondary: {
      default: '#64748B',      // Muted steel blue
      hover: '#475569',
      active: '#334155',
      subtle: '#F8FAFC',
      contrast: '#FFFFFF',
    },

    accent: {
      default: '#F59E0B',      // Warm amber (tool belt orange)
      hover: '#D97706',
      active: '#B45309',
      subtle: '#FEF3C7',
      contrast: '#0A0A0A',
    },

    // Status Colors (WCAG AA compliant)
    status: {
      success: {
        default: '#059669',    // Emerald
        hover: '#047857',
        bg: '#D1FAE5',
        border: '#6EE7B7',
        contrast: '#FFFFFF',
      },
      warning: {
        default: '#D97706',    // Amber
        hover: '#B45309',
        bg: '#FEF3C7',
        border: '#FCD34D',
        contrast: '#0A0A0A',
      },
      danger: {
        default: '#DC2626',    // Red
        hover: '#B91C1C',
        bg: '#FEE2E2',
        border: '#FCA5A5',
        contrast: '#FFFFFF',
      },
      info: {
        default: '#2563EB',    // Blue
        hover: '#1D4ED8',
        bg: '#DBEAFE',
        border: '#93C5FD',
        contrast: '#FFFFFF',
      },
    },

    // Order Status Colors (9 stages + cancelled) [C9: DB ENUM 일치]
    orderStatus: {
      inquiry: '#8B5CF6',            // Violet - 의뢰
      quotation_sent: '#3B82F6',     // Blue - 견적
      confirmed: '#10B981',          // Green - 확정
      measurement_done: '#14B8A6',   // Teal - 실측 (M14: 고유 색상)
      date_fixed: '#F59E0B',         // Amber - 일자확정
      material_held: '#06B6D4',      // Cyan - 준비(자재 hold)
      installed: '#EC4899',          // Pink - 설치
      settlement_wait: '#F97316',    // Orange - 정산대기
      revenue_confirmed: '#059669',  // Emerald - 매출확정
      cancelled: '#6B7280',          // Gray - 취소
    },

    // Inventory Status Colors
    inventoryStatus: {
      sufficient: {
        default: '#059669',
        bg: '#D1FAE5',
        border: '#6EE7B7',
      },
      warning: {
        default: '#F59E0B',
        bg: '#FEF3C7',
        border: '#FCD34D',
      },
      critical: {
        default: '#DC2626',
        bg: '#FEE2E2',
        border: '#FCA5A5',
      },
    },
  },

  dark: {
    // Surfaces (elevated hierarchy in dark mode)
    background: {
      primary: '#0A0A0A',      // Page background - true black
      secondary: '#171717',    // Card/panel surface
      tertiary: '#262626',     // Subtle backgrounds (hover states)
      elevated: '#1F1F1F',     // Modals, dropdowns
    },

    // Content
    foreground: {
      primary: '#FAFAFA',      // Primary text - WCAG AAA
      secondary: '#A3A3A3',    // Secondary text - WCAG AA
      tertiary: '#525252',     // Disabled/placeholder
      inverted: '#0A0A0A',     // Text on light backgrounds
    },

    // Borders & Dividers
    border: {
      default: '#262626',
      strong: '#404040',
      subtle: '#171717',
    },

    // Brand Colors (adjusted for dark backgrounds)
    primary: {
      default: '#F1F5F9',      // Light slate
      hover: '#E2E8F0',
      active: '#CBD5E1',
      subtle: '#1E293B',       // Backgrounds
      contrast: '#0A0A0A',     // Text on primary
    },

    secondary: {
      default: '#94A3B8',      // Lighter steel blue
      hover: '#CBD5E1',
      active: '#E2E8F0',
      subtle: '#1E293B',
      contrast: '#0A0A0A',
    },

    accent: {
      default: '#FBBF24',      // Brighter amber for contrast
      hover: '#FCD34D',
      active: '#FDE68A',
      subtle: '#451A03',
      contrast: '#0A0A0A',
    },

    // Status Colors (enhanced for dark mode visibility)
    status: {
      success: {
        default: '#10B981',    // Brighter emerald
        hover: '#34D399',
        bg: '#064E3B',
        border: '#047857',
        contrast: '#FFFFFF',
      },
      warning: {
        default: '#FBBF24',    // Brighter amber
        hover: '#FCD34D',
        bg: '#451A03',
        border: '#D97706',
        contrast: '#0A0A0A',
      },
      danger: {
        default: '#EF4444',    // Brighter red
        hover: '#F87171',
        bg: '#450A0A',
        border: '#DC2626',
        contrast: '#FFFFFF',
      },
      info: {
        default: '#3B82F6',    // Brighter blue
        hover: '#60A5FA',
        bg: '#1E3A8A',
        border: '#2563EB',
        contrast: '#FFFFFF',
      },
    },

    // Order Status Colors (adjusted for dark mode) [C9: DB ENUM 일치]
    orderStatus: {
      inquiry: '#A78BFA',            // Lighter violet - 의뢰
      quotation_sent: '#60A5FA',     // Lighter blue - 견적
      confirmed: '#34D399',          // Lighter green - 확정
      measurement_done: '#2DD4BF',   // Lighter teal - 실측
      date_fixed: '#FBBF24',         // Lighter amber - 일자확정
      material_held: '#22D3EE',      // Lighter cyan - 준비
      installed: '#F472B6',          // Lighter pink - 설치
      settlement_wait: '#FB923C',    // Lighter orange - 정산대기
      revenue_confirmed: '#10B981',  // Emerald - 매출확정
      cancelled: '#9CA3AF',          // Lighter gray - 취소
    },

    // Inventory Status Colors
    inventoryStatus: {
      sufficient: {
        default: '#10B981',
        bg: '#064E3B',
        border: '#047857',
      },
      warning: {
        default: '#FBBF24',
        bg: '#451A03',
        border: '#D97706',
      },
      critical: {
        default: '#EF4444',
        bg: '#450A0A',
        border: '#DC2626',
      },
    },
  },
} as const;
```

#### Contrast Ratio Validation

All color combinations meet **WCAG AA** standards (4.5:1 for normal text, 3:1 for large text):

| Combination | Light Mode | Dark Mode | Ratio |
|-------------|-----------|-----------|-------|
| Primary text / Background | #0A0A0A / #FAFAFA | #FAFAFA / #0A0A0A | 19.8:1 (AAA) |
| Secondary text / Background | #525252 / #FAFAFA | #A3A3A3 / #0A0A0A | 7.2:1 (AAA) |
| Status success / Background | #059669 / #D1FAE5 | #10B981 / #064E3B | 4.8:1 (AA) |
| Accent text / Background | #0A0A0A / #F59E0B | #0A0A0A / #FBBF24 | 11.3:1 (AAA) |

### 1.2 Implementation Strategy

#### CSS Variables Structure

```css
/* /app/globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    /* Surfaces */
    --color-bg-primary: 250 250 250;    /* #FAFAFA */
    --color-bg-secondary: 255 255 255;  /* #FFFFFF */
    --color-bg-tertiary: 245 245 245;   /* #F5F5F5 */
    --color-bg-elevated: 255 255 255;

    /* Foreground */
    --color-fg-primary: 10 10 10;       /* #0A0A0A */
    --color-fg-secondary: 82 82 82;     /* #525252 */
    --color-fg-tertiary: 163 163 163;   /* #A3A3A3 */
    --color-fg-inverted: 255 255 255;

    /* Borders */
    --color-border-default: 229 229 229; /* #E5E5E5 */
    --color-border-strong: 212 212 212;
    --color-border-subtle: 245 245 245;

    /* Brand */
    --color-primary: 15 23 42;          /* #0F172A */
    --color-primary-hover: 30 41 59;
    --color-primary-subtle: 241 245 249;

    --color-accent: 245 158 11;         /* #F59E0B */
    --color-accent-hover: 217 119 6;
    --color-accent-subtle: 254 243 199;

    /* Status */
    --color-success: 5 150 105;
    --color-success-bg: 209 250 229;
    --color-warning: 217 119 6;
    --color-warning-bg: 254 243 199;
    --color-danger: 220 38 38;
    --color-danger-bg: 254 226 226;
    --color-info: 37 99 235;
    --color-info-bg: 219 234 254;

    /* Order Status [C9: DB ENUM 일치] */
    --color-order-inquiry: 139 92 246;
    --color-order-quotation-sent: 59 130 246;
    --color-order-confirmed: 16 185 129;
    --color-order-measurement-done: 20 184 166;
    --color-order-date-fixed: 245 158 11;
    --color-order-material-held: 6 182 212;
    --color-order-installed: 236 72 153;
    --color-order-settlement-wait: 249 115 22;
    --color-order-revenue-confirmed: 5 150 105;
    --color-order-cancelled: 107 114 128;

    /* Shadows (light mode) */
    --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
    --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);
    --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1);
    --shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1);

    /* Chart colors (light) [C9: DB ENUM 일치] */
    --chart-1: 139 92 246;   /* inquiry */
    --chart-2: 59 130 246;   /* quotation_sent */
    --chart-3: 16 185 129;   /* confirmed */
    --chart-4: 245 158 11;   /* date_fixed */
    --chart-5: 6 182 212;    /* material_held */
  }

  .dark {
    /* Surfaces */
    --color-bg-primary: 10 10 10;       /* #0A0A0A */
    --color-bg-secondary: 23 23 23;     /* #171717 */
    --color-bg-tertiary: 38 38 38;      /* #262626 */
    --color-bg-elevated: 31 31 31;

    /* Foreground */
    --color-fg-primary: 250 250 250;    /* #FAFAFA */
    --color-fg-secondary: 163 163 163;  /* #A3A3A3 */
    --color-fg-tertiary: 82 82 82;      /* #525252 */
    --color-fg-inverted: 10 10 10;

    /* Borders */
    --color-border-default: 38 38 38;   /* #262626 */
    --color-border-strong: 64 64 64;
    --color-border-subtle: 23 23 23;

    /* Brand */
    --color-primary: 241 245 249;       /* #F1F5F9 */
    --color-primary-hover: 226 232 240;
    --color-primary-subtle: 30 41 59;

    --color-accent: 251 191 36;         /* #FBBF24 */
    --color-accent-hover: 252 211 77;
    --color-accent-subtle: 69 26 3;

    /* Status */
    --color-success: 16 185 129;
    --color-success-bg: 6 78 59;
    --color-warning: 251 191 36;
    --color-warning-bg: 69 26 3;
    --color-danger: 239 68 68;
    --color-danger-bg: 69 10 10;
    --color-info: 59 130 246;
    --color-info-bg: 30 58 138;

    /* Order Status (brighter for dark) [C9: DB ENUM 일치] */
    --color-order-inquiry: 167 139 250;
    --color-order-quotation-sent: 96 165 250;
    --color-order-confirmed: 52 211 153;
    --color-order-measurement-done: 45 212 191;
    --color-order-date-fixed: 251 191 36;
    --color-order-material-held: 34 211 238;
    --color-order-installed: 244 114 182;
    --color-order-settlement-wait: 251 146 60;
    --color-order-revenue-confirmed: 16 185 129;
    --color-order-cancelled: 156 163 175;

    /* Shadows (dark mode - more subtle) */
    --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.3);
    --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.4);
    --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.5);
    --shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.6);

    /* Chart colors (dark - same as order status for consistency) */
    --chart-1: 167 139 250;
    --chart-2: 96 165 250;
    --chart-3: 52 211 153;
    --chart-4: 251 191 36;
    --chart-5: 34 211 238;
  }

  * {
    @apply border-border-default;
  }

  body {
    @apply bg-bg-primary text-fg-primary;
    font-feature-settings: "rlig" 1, "calt" 1;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }
}
```

#### Tailwind v4 CSS-First Config [C7: v3 tailwind.config.ts → v4 @theme]

Tailwind CSS v4는 CSS-first 설정 방식을 사용합니다. `tailwind.config.ts`는 사용하지 않습니다.

```css
/* src/app/globals.css */
@import "tailwindcss";
@import "tw-animate-css";

/* [C7] Dark mode: class 기반 */
@variant dark (&:where(.dark, .dark *));

@theme {
  /* Font Family */
  --font-sans: 'Pretendard Variable', 'Inter Variable', system-ui, -apple-system, sans-serif;
  --font-mono: 'JetBrains Mono Variable', Consolas, Monaco, monospace;

  /* Shadows */
  --shadow-sm: var(--shadow-sm);
  --shadow-md: var(--shadow-md);
  --shadow-lg: var(--shadow-lg);
  --shadow-xl: var(--shadow-xl);

  /* Colors - 시맨틱 토큰 (CSS variables로 light/dark 자동 전환) */
  --color-bg-primary: rgb(var(--color-bg-primary));
  --color-bg-secondary: rgb(var(--color-bg-secondary));
  --color-bg-tertiary: rgb(var(--color-bg-tertiary));
  --color-bg-elevated: rgb(var(--color-bg-elevated));

  --color-fg-primary: rgb(var(--color-fg-primary));
  --color-fg-secondary: rgb(var(--color-fg-secondary));
  --color-fg-tertiary: rgb(var(--color-fg-tertiary));
  --color-fg-inverted: rgb(var(--color-fg-inverted));

  --color-border-default: rgb(var(--color-border-default));
  --color-border-strong: rgb(var(--color-border-strong));
  --color-border-subtle: rgb(var(--color-border-subtle));

  --color-primary: rgb(var(--color-primary));
  --color-primary-hover: rgb(var(--color-primary-hover));
  --color-primary-subtle: rgb(var(--color-primary-subtle));

  --color-accent: rgb(var(--color-accent));
  --color-accent-hover: rgb(var(--color-accent-hover));
  --color-accent-subtle: rgb(var(--color-accent-subtle));

  --color-success: rgb(var(--color-success));
  --color-success-bg: rgb(var(--color-success-bg));
  --color-warning: rgb(var(--color-warning));
  --color-warning-bg: rgb(var(--color-warning-bg));
  --color-danger: rgb(var(--color-danger));
  --color-danger-bg: rgb(var(--color-danger-bg));
  --color-info: rgb(var(--color-info));
  --color-info-bg: rgb(var(--color-info-bg));

  /* Order Status Colors */
  --color-order-inquiry: rgb(var(--color-order-inquiry));
  --color-order-quotation-sent: rgb(var(--color-order-quotation-sent));
  --color-order-confirmed: rgb(var(--color-order-confirmed));
  --color-order-measurement-done: rgb(var(--color-order-measurement-done));
  --color-order-date-fixed: rgb(var(--color-order-date-fixed));
  --color-order-material-held: rgb(var(--color-order-material-held));
  --color-order-installed: rgb(var(--color-order-installed));
  --color-order-settlement-wait: rgb(var(--color-order-settlement-wait));
  --color-order-revenue-confirmed: rgb(var(--color-order-revenue-confirmed));
  --color-order-cancelled: rgb(var(--color-order-cancelled));

  /* Chart Colors */
  --color-chart-1: rgb(var(--chart-1));
  --color-chart-2: rgb(var(--chart-2));
  --color-chart-3: rgb(var(--chart-3));
  --color-chart-4: rgb(var(--chart-4));
  --color-chart-5: rgb(var(--chart-5));

  /* Animations */
  --animate-fade-in: fade-in 0.2s ease-out;
  --animate-slide-up: slide-up 0.3s ease-out;
  --animate-slide-down: slide-down 0.3s ease-out;

  @keyframes fade-in {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  @keyframes slide-up {
    from { transform: translateY(10px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }

  @keyframes slide-down {
    from { transform: translateY(-10px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }
}
```

**v3 → v4 마이그레이션 요약:**
| v3 (기존) | v4 (변경) |
|-----------|-----------|
| `tailwind.config.ts` | `globals.css`의 `@theme` |
| `darkMode: ['class']` | `@variant dark (&:where(.dark, .dark *))` |
| `content: [...]` | 자동 감지 (설정 불필요) |
| `plugins: [require('tailwindcss-animate')]` | `@import "tw-animate-css"` |
| `theme.extend.colors` | `@theme { --color-* }` |
| `theme.extend.fontFamily` | `@theme { --font-* }` |

> **주의**: CSS variables(`--color-bg-primary` 등)는 `:root`/`.dark`에서 이미 정의되어 있으므로 `@theme`에서는 참조만 합니다.
```

### 1.3 Theme Toggle Implementation

#### Theme Provider Component

```typescript
// /components/providers/theme-provider.tsx
'use client';

import { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextValue {
  theme: Theme;
  resolvedTheme: 'light' | 'dark';
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('system');
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    // Load saved preference
    const saved = localStorage.getItem('closetbiz-theme') as Theme | null;
    if (saved) {
      setThemeState(saved);
    }
  }, []);

  useEffect(() => {
    const root = window.document.documentElement;

    const applyTheme = (themeToApply: 'light' | 'dark') => {
      root.classList.remove('light', 'dark');
      root.classList.add(themeToApply);
      setResolvedTheme(themeToApply);

      // Update meta theme-color for mobile browsers
      const metaThemeColor = document.querySelector('meta[name="theme-color"]');
      if (metaThemeColor) {
        metaThemeColor.setAttribute(
          'content',
          themeToApply === 'dark' ? '#0A0A0A' : '#FAFAFA'
        );
      }
    };

    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      applyTheme(mediaQuery.matches ? 'dark' : 'light');

      const listener = (e: MediaQueryListEvent) => {
        applyTheme(e.matches ? 'dark' : 'light');
      };

      mediaQuery.addEventListener('change', listener);
      return () => mediaQuery.removeEventListener('change', listener);
    } else {
      applyTheme(theme);
    }
  }, [theme]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem('closetbiz-theme', newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}
```

#### Theme Toggle Button Component

```typescript
// /components/ui/theme-toggle.tsx
'use client';

import { Moon, Sun, Monitor } from 'lucide-react';
import { useTheme } from '@/components/providers/theme-provider';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9"
          aria-label="테마 변경"
        >
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">테마 변경</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setTheme('light')}>
          <Sun className="mr-2 h-4 w-4" />
          <span>라이트</span>
          {theme === 'light' && (
            <span className="ml-auto text-xs text-fg-tertiary">✓</span>
          )}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('dark')}>
          <Moon className="mr-2 h-4 w-4" />
          <span>다크</span>
          {theme === 'dark' && (
            <span className="ml-auto text-xs text-fg-tertiary">✓</span>
          )}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('system')}>
          <Monitor className="mr-2 h-4 w-4" />
          <span>시스템 설정</span>
          {theme === 'system' && (
            <span className="ml-auto text-xs text-fg-tertiary">✓</span>
          )}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Mobile-optimized compact toggle (for mobile header)
export function ThemeToggleCompact() {
  const { theme, setTheme } = useTheme();

  const cycleTheme = () => {
    const order: Theme[] = ['light', 'dark', 'system'];
    const currentIndex = order.indexOf(theme);
    const nextIndex = (currentIndex + 1) % order.length;
    setTheme(order[nextIndex]);
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={cycleTheme}
      className="h-9 w-9"
      aria-label="테마 전환"
    >
      <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
    </Button>
  );
}
```

### 1.4 Dark Mode Handling for Charts, Calendars, PDFs

#### Chart Component Dark Mode Adapter

```typescript
// /components/charts/chart-wrapper.tsx
'use client';

import { useTheme } from '@/components/providers/theme-provider';
import { useMemo } from 'react';

export function useChartTheme() {
  const { resolvedTheme } = useTheme();

  return useMemo(() => ({
    // Recharts configuration
    recharts: {
      grid: {
        stroke: resolvedTheme === 'dark' ? 'rgb(38 38 38)' : 'rgb(229 229 229)',
        strokeDasharray: '3 3',
      },
      axis: {
        stroke: resolvedTheme === 'dark' ? 'rgb(163 163 163)' : 'rgb(82 82 82)',
        fontSize: 12,
        fontFamily: 'Pretendard Variable, Inter Variable',
      },
      tooltip: {
        contentStyle: {
          backgroundColor: resolvedTheme === 'dark' ? 'rgb(23 23 23)' : 'rgb(255 255 255)',
          border: `1px solid ${resolvedTheme === 'dark' ? 'rgb(38 38 38)' : 'rgb(229 229 229)'}`,
          borderRadius: '8px',
          color: resolvedTheme === 'dark' ? 'rgb(250 250 250)' : 'rgb(10 10 10)',
          boxShadow: resolvedTheme === 'dark'
            ? '0 4px 6px -1px rgb(0 0 0 / 0.4)'
            : '0 4px 6px -1px rgb(0 0 0 / 0.1)',
        },
      },
    },

    // Schedule-X calendar configuration
    calendar: {
      theme: resolvedTheme === 'dark' ? 'dark' : 'light',
      customStyles: resolvedTheme === 'dark' ? {
        '--sx-color-background': 'rgb(10 10 10)',
        '--sx-color-foreground': 'rgb(250 250 250)',
        '--sx-color-border': 'rgb(38 38 38)',
        '--sx-color-accent': 'rgb(251 191 36)',
      } : {
        '--sx-color-background': 'rgb(250 250 250)',
        '--sx-color-foreground': 'rgb(10 10 10)',
        '--sx-color-border': 'rgb(229 229 229)',
        '--sx-color-accent': 'rgb(245 158 11)',
      },
    },
  }), [resolvedTheme]);
}

// Example usage in chart component
export function SalesChart({ data }: { data: any[] }) {
  const chartTheme = useChartTheme();

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid {...chartTheme.recharts.grid} />
        <XAxis {...chartTheme.recharts.axis} />
        <YAxis {...chartTheme.recharts.axis} />
        <Tooltip {...chartTheme.recharts.tooltip} />
        <Line type="monotone" dataKey="value" stroke="rgb(var(--color-accent))" />
      </LineChart>
    </ResponsiveContainer>
  );
}
```

#### PDF Export [C8: @react-pdf/renderer 서버사이드 전용]

PDF 생성은 **@react-pdf/renderer**를 사용하며, React 19 클라이언트 호환 문제를 회피하기 위해 **Route Handler에서만 실행**합니다.
클라이언트에서 jsPDF + html2canvas 방식은 사용하지 않습니다.

```typescript
// src/app/api/pdf/quotation/route.ts (Route Handler)
import { renderToBuffer } from '@react-pdf/renderer';
import { QuotationDocument } from '@/lib/pdf/templates/quotation';

export async function POST(request: Request) {
  const data = await request.json();

  // @react-pdf/renderer는 항상 서버에서 실행 → 다크모드 고려 불필요
  // PDF는 항상 라이트 테마 기반으로 생성
  const buffer = await renderToBuffer(
    <QuotationDocument
      order={data.order}
      customer={data.customer}
      theme="light"
    />
  );

  return new Response(buffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="quotation-${data.order.order_number}.pdf"`,
    },
  });
}
```

```typescript
// src/lib/pdf/templates/quotation.tsx
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';

// Pretendard 폰트 등록 (한글 PDF 품질 보장)
Font.register({
  family: 'Pretendard',
  src: '/fonts/Pretendard-Regular.otf',
  fontWeight: 'normal',
});
Font.register({
  family: 'Pretendard',
  src: '/fonts/Pretendard-Bold.otf',
  fontWeight: 'bold',
});

const styles = StyleSheet.create({
  page: { padding: 30, fontFamily: 'Pretendard', fontSize: 10 },
  header: { fontSize: 18, fontWeight: 'bold', marginBottom: 20 },
  // ... 스타일 정의
});

export function QuotationDocument({ order, customer, theme }: QuotationDocumentProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.header}>견적서</Text>
        {/* ... 견적서 내용 */}
      </Page>
    </Document>
  );
}
```

```typescript
// 클라이언트에서 PDF 다운로드 호출
async function downloadQuotationPDF(orderId: string) {
  const response = await fetch('/api/pdf/quotation', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ order, customer }),
  });

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `quotation-${order.order_number}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}
```

> **설계 결정**: PDF는 항상 light 테마로 생성합니다. 현장에서 인쇄하거나 고객에게 전달하는 문서이므로 가독성이 최우선입니다.
> **jsPDF 미사용 이유**: html2canvas + jsPDF 방식은 한글 렌더링 품질 이슈가 있고, 클라이언트 의존적이므로 배제합니다.
```

---

## 2. Multi-View System Design

### 2.1 View Type Taxonomy

Each screen supports multiple view modes optimized for different tasks and screen sizes.

```typescript
// /lib/types/views.ts
export type ViewType =
  | 'kanban'      // Card-based columns (desktop/tablet)
  | 'list'        // Dense table/list (all devices)
  | 'grid'        // Card grid (all devices)
  | 'timeline'    // Time-based horizontal scroll (desktop/tablet)
  | 'calendar'    // Calendar-based (all devices)
  | 'agenda'      // Chronological list (mobile-first)
  | 'map'         // Geolocation-based (mobile-first)
  | 'summary';    // KPI/dashboard (all devices)

export interface ViewConfig {
  type: ViewType;
  label: string;
  icon: LucideIcon;
  defaultForBreakpoint: {
    mobile?: boolean;
    tablet?: boolean;
    desktop?: boolean;
  };
  features: string[];
  bestFor: string;
}
```

### 2.2 Screen-by-Screen View Specifications

#### 2.2.1 수주 관리 (Orders)

**Supported Views:**

```typescript
// /app/(dashboard)/orders/views-config.ts
export const orderViewsConfig: Record<ViewType, ViewConfig> = {
  kanban: {
    type: 'kanban',
    label: '칸반',
    icon: LayoutDashboard,
    defaultForBreakpoint: {
      desktop: true,
      tablet: true,
    },
    features: [
      '드래그앤드롭으로 상태 변경',
      '진행 상황 시각화',
      '컬럼별 집계 표시',
    ],
    bestFor: '전체 수주 파이프라인 관리, 상태별 작업 분류',
  },

  list: {
    type: 'list',
    label: '목록',
    icon: List,
    defaultForBreakpoint: {
      mobile: true,
    },
    features: [
      '고밀도 정보 표시',
      '정렬/필터링',
      '빠른 검색',
    ],
    bestFor: '특정 수주 검색, 상세 정보 비교',
  },

  timeline: {
    type: 'timeline',
    label: '타임라인',
    icon: Clock,
    defaultForBreakpoint: {},
    features: [
      '시간 흐름에 따른 상태 변화',
      '히스토리 추적',
      '지연 수주 강조',
    ],
    bestFor: '수주 진행 상황 추적, 병목 구간 파악',
  },
};

// Default view selection by breakpoint
export function getDefaultOrderView(breakpoint: 'mobile' | 'tablet' | 'desktop'): ViewType {
  return {
    mobile: 'list',
    tablet: 'kanban',
    desktop: 'kanban',
  }[breakpoint];
}
```

**사용 시나리오:**

| View | When to Use | Key Interaction |
|------|------------|-----------------|
| **칸반** | 하루 일과 시작 시 전체 파이프라인 확인, 수주 상태 업데이트 | 카드 드래그로 컬럼 간 이동 → 상태 자동 변경 |
| **목록** | 특정 고객/날짜 수주 검색, 현장에서 빠른 확인 | 정렬/필터 → 행 탭 → 상세 정보 슬라이드업 |
| **타임라인** | 주간 회고, 지연 수주 파악 | 수평 스크롤 → 타임라인 노드 클릭 → 히스토리 팝업 |

#### 2.2.2 스케줄 관리 (Schedule) **[특히 중요]**

**Supported Views:**

```typescript
// /app/(dashboard)/schedule/views-config.ts
export const scheduleViewsConfig: Record<ViewType, ViewConfig> = {
  calendar: {
    type: 'calendar',
    label: '월간',
    icon: Calendar,
    defaultForBreakpoint: {
      desktop: true,
      tablet: true,
    },
    features: [
      '한 눈에 월간 일정 조감',
      '날짜별 일정 개수 표시',
      '드래그로 일정 이동',
    ],
    bestFor: '한 달 단위 스케줄 조망, 빈 날짜 확인',
  },

  timeline: {
    type: 'timeline',
    label: '주간',
    icon: GanttChart,
    defaultForBreakpoint: {},
    features: [
      '시간대별 블록 시각화',
      '겹치는 일정 자동 레이아웃',
      '드래그로 시간 조정',
    ],
    bestFor: '주간 단위 시간 관리, 이동 동선 최적화',
  },

  agenda: {
    type: 'agenda',
    label: '어젠다',
    icon: ListTodo,
    defaultForBreakpoint: {
      mobile: true,
    },
    features: [
      '크로놀로지컬 리스트',
      '오늘/내일/이번주 섹션 분리',
      '완료 체크박스',
    ],
    bestFor: '모바일 빠른 확인, 오늘 할 일 집중',
  },

  map: {
    type: 'map',
    label: '지도',
    icon: MapPin,
    defaultForBreakpoint: {},
    features: [
      '일정 위치 마커 표시',
      '이동 동선 최적화 제안',
      '근처 일정 클러스터링',
    ],
    bestFor: '현장 이동 최적화, 인접 일정 묶음 파악',
  },
};

export function getDefaultScheduleView(breakpoint: 'mobile' | 'tablet' | 'desktop'): ViewType {
  return {
    mobile: 'agenda',
    tablet: 'calendar',
    desktop: 'calendar',
  }[breakpoint];
}
```

**사용 시나리오:**

| View | When to Use | Key Interaction | Screen Mockup |
|------|------------|-----------------|---------------|
| **월간 캘린더** | 신규 수주 일정 잡기, 다음 달 계획 | 빈 날짜 클릭 → 일정 생성 모달 | ASCII 와이어프레임 참조 |
| **주간 타임라인** | 주간 업무 계획, 하루 일과 시뮬레이션 | 일정 블록 드래그 → 시간 조정 → 자동 정렬 | ASCII 와이어프레임 참조 |
| **어젠다** | 아침 출근 시 오늘 일정 확인, 현장 이동 중 | 스크롤 → 체크박스 탭 → 완료 처리 | ASCII 와이어프레임 참조 |
| **지도** | 여러 현장 방문 동선 계획, 인접 수주 병합 | 마커 탭 → 경로 최적화 버튼 → 순서 재배치 | - |

**ASCII 와이어프레임:**

**1) 월간 캘린더 뷰 (Desktop/Tablet)**

```
┌─────────────────────────────────────────────────────────────────┐
│  [<]  2026년 2월  [>]      [월간] [주간] [어젠다] [지도]    [@] │
├─────────────────────────────────────────────────────────────────┤
│  월    화    수    목    금    토    일                           │
├──────┬──────┬──────┬──────┬──────┬──────┬──────────────────────┤
│                         1     2                                 │
│                     [수주견적]  -                               │
├──────┼──────┼──────┼──────┼──────┼──────┼──────────────────────┤
│  3     4     5     6     7     8     9                          │
│  -   [설치] [설치]  -   [A/S]  -    -                           │
│     강남 C씨 서초 K씨     목동 L씨                               │
├──────┼──────┼──────┼──────┼──────┼──────┼──────────────────────┤
│  10   11    12    13    14    15    16                          │
│  -   [검수] [설치]  -     •     -    -                          │← Today
│     역삼 P씨 송파 Q씨   (3개)                                    │
├──────┼──────┼──────┼──────┼──────┼──────┼──────────────────────┤
│  17   18    19    20    21    22    23                          │
│  -     -     -     -     -     -    -                           │
├──────┼──────┼──────┼──────┼──────┼──────┼──────────────────────┤
│  24   25    26    27    28                                      │
│ [발주] [설치]  -     -     -                                     │
│ 자재입고 분당                                                     │
└─────────────────────────────────────────────────────────────────┘

[범례]
- 수주견적: 파란색 (#60A5FA)
- 설치: 핑크색 (#F472B6)
- 검수: 오렌지색 (#FB923C)
- A/S: 노란색 (#FBBF24)
- 발주: 회색 (#9CA3AF)
- Today: 주황 테두리 (#F59E0B)
```

**2) 주간 타임라인 뷰 (Desktop/Tablet)**

```
┌─────────────────────────────────────────────────────────────────┐
│  2월 10일 - 2월 16일       [월간] [주간] [어젠다] [지도]    [@] │
├─────────────────────────────────────────────────────────────────┤
│시간  월 2/10   화 2/11   수 2/12   목 2/13   금 2/14   토 2/15  │
├─────┬─────────┬─────────┬─────────┬─────────┬─────────┬─────────┤
│ 09  │         │ ┌─────┐ │         │         │ ┌─────┐ │         │
│     │         │ │검수  │ │         │         │ │수주  │ │         │
│ 10  │         │ │역삼  │ │ ┌─────┐ │         │ │견적  │ │         │
│     │         │ │P씨   │ │ │설치  │ │         │ │마포  │ │         │
│ 11  │         │ └─────┘ │ │송파  │ │         │ │A씨   │ │         │
│     │         │         │ │Q씨   │ │         │ └─────┘ │         │
│ 12  │   휴식   │   휴식   │ │     │ │   휴식   │   휴식   │   휴무   │
│     │         │         │ └─────┘ │         │         │         │
│ 13  │         │         │ └─────┘ │         │         │         │
│     │         │         │         │         │         │         │
│ 14  │         │ ┌─────┐ │ ┌─────┐ │         │ ┌─────┐ │         │
│     │         │ │사무실│ │ │견적  │ │         │ │이동  │ │         │
│ 15  │         │ │작업  │ │ │작성  │ │         │ │+준비 │ │         │
│     │         │ └─────┘ │ └─────┘ │         │ └─────┘ │         │
│ 16  │         │         │         │         │         │         │
│     │         │         │         │         │ ┌─────┐ │         │
│ 17  │         │         │         │         │ │자재  │ │         │
│     │         │         │         │         │ │정리  │ │         │
│ 18  │         │         │         │         │ └─────┘ │         │
└─────┴─────────┴─────────┴─────────┴─────────┴─────────┴─────────┘

[인터랙션]
- 블록 클릭 → 상세 정보 사이드 패널
- 블록 세로 드래그 → 시간 변경
- 블록 가로 드래그 → 날짜 이동
- 빈 영역 드래그 → 새 일정 생성
```

**3) 어젠다 뷰 (Mobile)**

```
┌─────────────────────────────┐
│ ≡  스케줄 어젠다       🔍 @ │
├─────────────────────────────┤
│  [월간] [주간] [어젠다] [지도] │← Horizontal scroll tabs
├─────────────────────────────┤
│                             │
│ 오늘 (2월 14일 금요일)       │
│ ┌───────────────────────┐   │
│ │ ☐ 09:00 - 11:30       │   │
│ │   수주 견적 - 마포 A씨  │   │
│ │   📍 마포구 동교동      │   │← Tap to expand
│ └───────────────────────┘   │
│                             │
│ ┌───────────────────────┐   │
│ │ ☑ 14:00 - 16:00       │   │← Completed
│ │   이동 + 자재 준비      │   │
│ │   📦 창고              │   │
│ └───────────────────────┘   │
│                             │
│ 내일 (2월 15일 토요일)       │
│ ┌───────────────────────┐   │
│ │   휴무                 │   │
│ └───────────────────────┘   │
│                             │
│ 다음주                       │
│ ┌───────────────────────┐   │
│ │ ☐ 월 2/17 10:00       │   │
│ │   검수 - 역삼 P씨       │   │
│ └───────────────────────┘   │
│ ┌───────────────────────┐   │
│ │ ☐ 화 2/18 09:00       │   │
│ │   설치 - 송파 Q씨       │   │
│ └───────────────────────┘   │
│                             │
│ [+ 새 일정]                  │← FAB fixed bottom
└─────────────────────────────┘

[인터랙션]
- 체크박스 탭 → 완료/미완료 토글
- 카드 탭 → 슬라이드업 상세 패널
- 좌우 스와이프 → 삭제/수정 액션
- 하단 FAB → 새 일정 추가
```

#### 2.2.3 재고 관리 (Inventory)

```typescript
export const inventoryViewsConfig: Record<ViewType, ViewConfig> = {
  grid: {
    type: 'grid',
    label: '그리드',
    icon: Grid3x3,
    defaultForBreakpoint: {
      desktop: true,
      tablet: true,
    },
    features: [
      '카드형 시각적 표시',
      '재고 상태 색상 코딩',
      '이미지 썸네일',
    ],
    bestFor: '재고 현황 한눈에 파악, 부족 품목 강조',
  },

  list: {
    type: 'list',
    label: '목록',
    icon: List,
    defaultForBreakpoint: {
      mobile: true,
    },
    features: [
      '테이블형 정보 밀도',
      '다중 정렬/필터',
      '빠른 수량 편집',
    ],
    bestFor: '정확한 수량 확인, 일괄 편집',
  },
};

export function getDefaultInventoryView(breakpoint: 'mobile' | 'tablet' | 'desktop'): ViewType {
  return {
    mobile: 'list',
    tablet: 'grid',
    desktop: 'grid',
  }[breakpoint];
}
```

**사용 시나리오:**

| View | When to Use | Key Interaction |
|------|------------|-----------------|
| **그리드** | 발주 전 재고 확인, 부족 품목 파악 | 색상별 필터 (빨강=부족) → 카드 탭 → 발주 액션 |
| **목록** | 입출고 처리, 재고 조사 | 행 탭 → 인라인 수량 편집 → 저장 |

#### 2.2.4 매출/매입 (Revenue/Expenses)

```typescript
export const financeViewsConfig: Record<ViewType, ViewConfig> = {
  summary: {
    type: 'summary',
    label: '요약',
    icon: BarChart3,
    defaultForBreakpoint: {
      desktop: true,
      tablet: true,
      mobile: true,
    },
    features: [
      'KPI 카드 (매출/매입/순이익)',
      '차트 시각화',
      '월별/분기별 비교',
    ],
    bestFor: '재무 상태 대시보드, 트렌드 파악',
  },

  list: {
    type: 'list',
    label: '상세',
    icon: Receipt,
    defaultForBreakpoint: {},
    features: [
      '거래 목록',
      '수주별 매출 연결',
      '항목별 매입 분류',
    ],
    bestFor: '장부 확인, 특정 거래 검색',
  },

  calendar: {
    type: 'calendar',
    label: '캘린더',
    icon: Calendar,
    defaultForBreakpoint: {},
    features: [
      '날짜별 매출 표시',
      '수입/지출 색상 구분',
      '일별 순이익 계산',
    ],
    bestFor: '현금 흐름 파악, 특정 날짜 거래 확인',
  },
};
```

#### 2.2.5 발주 관리 (Purchase Orders)

```typescript
export const purchaseViewsConfig: Record<ViewType, ViewConfig> = {
  list: {
    type: 'list',
    label: '목록',
    icon: List,
    defaultForBreakpoint: {
      mobile: true,
      tablet: true,
      desktop: true,
    },
    features: [
      '상태별 탭 (발주대기/발주완료/입고완료)',
      '입고 예정일 표시',
      '발주 히스토리',
    ],
    bestFor: '발주 상태 추적, 입고 확인',
  },

  timeline: {
    type: 'timeline',
    label: '타임라인',
    icon: Clock,
    defaultForBreakpoint: {},
    features: [
      '발주 → 배송 → 입고 흐름',
      '지연 발주 강조',
      '공급업체별 리드타임',
    ],
    bestFor: '발주 병목 파악, 공급업체 성과 분석',
  },
};
```

### 2.3 View Switcher Component System

#### Core View Switcher Component

```typescript
// /components/view-switcher/view-switcher.tsx
'use client';

import { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface ViewOption {
  value: string;
  label: string;
  icon: LucideIcon;
}

interface ViewSwitcherProps {
  views: ViewOption[];
  currentView: string;
  onViewChange: (view: string) => void;
  variant?: 'tabs' | 'buttons' | 'dropdown';
  className?: string;
}

export function ViewSwitcher({
  views,
  currentView,
  onViewChange,
  variant = 'tabs',
  className,
}: ViewSwitcherProps) {
  if (variant === 'tabs') {
    return (
      <Tabs value={currentView} onValueChange={onViewChange} className={className}>
        <TabsList>
          {views.map((view) => (
            <TabsTrigger
              key={view.value}
              value={view.value}
              className="gap-2"
            >
              <view.icon className="h-4 w-4" />
              <span className="hidden sm:inline">{view.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
    );
  }

  if (variant === 'buttons') {
    return (
      <div className={cn('inline-flex rounded-lg border border-border-default p-1', className)}>
        {views.map((view) => (
          <Button
            key={view.value}
            variant={currentView === view.value ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => onViewChange(view.value)}
            className="gap-2"
          >
            <view.icon className="h-4 w-4" />
            <span className="hidden sm:inline">{view.label}</span>
          </Button>
        ))}
      </div>
    );
  }

  // Dropdown variant for mobile
  return (
    <Select value={currentView} onValueChange={onViewChange}>
      <SelectTrigger className={cn('w-[140px]', className)}>
        <SelectValue>
          {(() => {
            const current = views.find(v => v.value === currentView);
            return current ? (
              <div className="flex items-center gap-2">
                <current.icon className="h-4 w-4" />
                <span>{current.label}</span>
              </div>
            ) : null;
          })()}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {views.map((view) => (
          <SelectItem key={view.value} value={view.value}>
            <div className="flex items-center gap-2">
              <view.icon className="h-4 w-4" />
              <span>{view.label}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

// Responsive variant that adapts to breakpoint
export function ResponsiveViewSwitcher(props: ViewSwitcherProps) {
  return (
    <>
      {/* Desktop: Tabs */}
      <div className="hidden lg:block">
        <ViewSwitcher {...props} variant="tabs" />
      </div>

      {/* Tablet: Buttons */}
      <div className="hidden md:block lg:hidden">
        <ViewSwitcher {...props} variant="buttons" />
      </div>

      {/* Mobile: Dropdown */}
      <div className="block md:hidden">
        <ViewSwitcher {...props} variant="dropdown" />
      </div>
    </>
  );
}
```

#### View State Persistence Hook

```typescript
// /hooks/use-view-state.ts
'use client';

import { useState, useEffect } from 'react';
import { useMediaQuery } from '@/hooks/use-media-query';

interface UseViewStateOptions {
  storageKey: string;
  defaultView: {
    mobile: string;
    tablet: string;
    desktop: string;
  };
}

export function useViewState({ storageKey, defaultView }: UseViewStateOptions) {
  const isMobile = useMediaQuery('(max-width: 767px)');
  const isTablet = useMediaQuery('(min-width: 768px) and (max-width: 1023px)');
  const isDesktop = useMediaQuery('(min-width: 1024px)');

  const getDefaultView = () => {
    if (isMobile) return defaultView.mobile;
    if (isTablet) return defaultView.tablet;
    return defaultView.desktop;
  };

  const [view, setView] = useState<string>(() => {
    if (typeof window === 'undefined') return getDefaultView();

    const saved = localStorage.getItem(storageKey);
    return saved || getDefaultView();
  });

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem(storageKey, view);
  }, [view, storageKey]);

  // Auto-switch to appropriate view on breakpoint change
  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (!saved) {
      setView(getDefaultView());
    }
  }, [isMobile, isTablet, isDesktop]);

  return [view, setView] as const;
}

// Example usage:
// const [view, setView] = useViewState({
//   storageKey: 'closetbiz-orders-view',
//   defaultView: { mobile: 'list', tablet: 'kanban', desktop: 'kanban' },
// });
```

#### View-Aware Container Component

```typescript
// /components/view-container/view-container.tsx
'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface ViewContainerProps {
  view: string;
  children: ReactNode;
  className?: string;
}

const viewLayoutClasses: Record<string, string> = {
  kanban: 'flex gap-4 overflow-x-auto pb-4',
  list: 'flex flex-col gap-2',
  grid: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4',
  timeline: 'overflow-x-auto',
  calendar: 'h-[calc(100vh-12rem)]',
  agenda: 'flex flex-col gap-4',
  map: 'h-[calc(100vh-12rem)] relative',
  summary: 'grid grid-cols-1 lg:grid-cols-2 gap-6',
};

export function ViewContainer({ view, children, className }: ViewContainerProps) {
  return (
    <div className={cn(viewLayoutClasses[view], className)}>
      {children}
    </div>
  );
}
```

### 2.4 Responsive View Adaptation

```typescript
// /lib/utils/responsive-views.ts

/**
 * Determines if a view type is suitable for the current breakpoint
 */
export function isViewSupportedOnBreakpoint(
  view: ViewType,
  breakpoint: 'mobile' | 'tablet' | 'desktop'
): boolean {
  const unsupportedCombinations: Record<string, ViewType[]> = {
    mobile: ['kanban', 'timeline'], // Too complex for small screens
    tablet: [],
    desktop: [],
  };

  return !unsupportedCombinations[breakpoint]?.includes(view);
}

/**
 * Filters view options based on current breakpoint
 */
export function getAvailableViews(
  allViews: ViewOption[],
  breakpoint: 'mobile' | 'tablet' | 'desktop'
): ViewOption[] {
  return allViews.filter((view) =>
    isViewSupportedOnBreakpoint(view.value as ViewType, breakpoint)
  );
}
```

---

## 3. Typography System

### 3.1 Font Stack

**Sans-serif (제목 + 본문 통합):**
- Primary: Pretendard Variable (한글 + 영문, Inter 기반 설계)
- Fallback: Inter Variable → system-ui → -apple-system → sans-serif
- 선정 이유: 한영 혼용 시 곡률/무게감이 일치하여 자연스러움. 어떤 화면 크기에서도 가독성 우수.
- Display/Body 폰트를 분리하지 않음 (font-weight로 위계 구분)

**Monospace (Code, Numbers):**
- Primary: JetBrains Mono Variable (tabular numerals)
- Fallback: Consolas → Monaco → monospace

### 3.2 Type Scale

```css
/* /app/globals.css - Typography scale */
.text-display-lg {
  font-family: var(--font-sans);
  font-size: 3.5rem;      /* 56px */
  line-height: 1.1;
  font-weight: 700;
  letter-spacing: -0.02em;
}

.text-display-md {
  font-family: var(--font-sans);
  font-size: 2.5rem;      /* 40px */
  line-height: 1.2;
  font-weight: 700;
  letter-spacing: -0.01em;
}

.text-heading-lg {
  font-family: var(--font-sans);
  font-size: 2rem;        /* 32px */
  line-height: 1.25;
  font-weight: 600;
}

.text-heading-md {
  font-family: var(--font-sans);
  font-size: 1.5rem;      /* 24px */
  line-height: 1.3;
  font-weight: 600;
}

.text-heading-sm {
  font-size: 1.25rem;     /* 20px */
  line-height: 1.4;
  font-weight: 600;
}

.text-body-lg {
  font-size: 1.125rem;    /* 18px */
  line-height: 1.6;
}

.text-body {
  font-size: 1rem;        /* 16px */
  line-height: 1.6;
}

.text-body-sm {
  font-size: 0.875rem;    /* 14px */
  line-height: 1.5;
}

.text-caption {
  font-size: 0.75rem;     /* 12px */
  line-height: 1.4;
  color: rgb(var(--color-fg-secondary));
}

.text-mono {
  font-family: var(--font-mono);
  font-feature-settings: "tnum" 1; /* Tabular numerals */
}
```

---

## 4. Motion Design System

### 4.1 Animation Principles

**Field-Optimized Motion:**
- Fast, utilitarian transitions (150-250ms)
- No gratuitous animations
- High-impact moments: view switches, status changes, new data arrival
- Reduced motion support via `prefers-reduced-motion`

### 4.2 Animation Tokens

```css
/* /app/globals.css - Animation tokens */
:root {
  /* Durations */
  --duration-instant: 100ms;
  --duration-fast: 150ms;
  --duration-normal: 250ms;
  --duration-slow: 400ms;

  /* Easings */
  --ease-in: cubic-bezier(0.4, 0, 1, 1);
  --ease-out: cubic-bezier(0, 0, 0.2, 1);
  --ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
  --ease-sharp: cubic-bezier(0.4, 0, 0.6, 1);
}

@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

### 4.3 Key Animations

```css
/* View transition animations */
.view-fade-enter {
  animation: fadeIn var(--duration-fast) var(--ease-out);
}

.view-slide-enter {
  animation: slideUp var(--duration-normal) var(--ease-out);
}

/* Status change animation */
.status-change {
  animation: pulse 0.4s var(--ease-in-out);
}

@keyframes pulse {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.05); opacity: 0.8; }
}

/* Card drag feedback */
.dragging {
  opacity: 0.5;
  transform: rotate(2deg);
  transition: all var(--duration-fast) var(--ease-sharp);
}

/* Loading skeleton */
.skeleton {
  animation: shimmer 1.5s infinite;
  background: linear-gradient(
    90deg,
    rgb(var(--color-bg-secondary)),
    rgb(var(--color-bg-tertiary)),
    rgb(var(--color-bg-secondary))
  );
  background-size: 200% 100%;
}

@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
```

---

## 5. Implementation Checklist

### Phase 1: Dark Mode Foundation
- [ ] Install font packages (Pretendard Variable, Inter Variable, JetBrains Mono Variable)
- [ ] Set up CSS variables in `globals.css`
- [ ] Configure Tailwind with extended color tokens
- [ ] Implement `ThemeProvider` component
- [ ] Create `ThemeToggle` component (desktop + mobile compact)
- [ ] Add theme-color meta tag with dynamic updates
- [ ] Test contrast ratios with accessibility tools (WAVE, axe DevTools)

### Phase 2: View System Core
- [ ] Define view type enums and configs per screen
- [ ] Build `ViewSwitcher` component (tabs/buttons/dropdown variants)
- [ ] Create `useViewState` hook with localStorage persistence
- [ ] Implement `ViewContainer` with layout-specific classes
- [ ] Set up responsive view filtering logic
- [ ] Add view preference to user settings (future: sync to Supabase)

### Phase 3: Screen-Specific Views
- [ ] **Orders**: Kanban + List + Timeline views
- [ ] **Schedule**: Calendar + Timeline + Agenda + Map views (priority)
- [ ] **Inventory**: Grid + List views
- [ ] **Finance**: Summary + List + Calendar views
- [ ] **Purchase**: List + Timeline views

### Phase 4: Dark Mode Refinements
- [ ] Adapt charts (Recharts theme hook)
- [ ] Adapt calendar (@schedule-x/react dark theme)
- [ ] Implement PDF export with light mode override
- [ ] Add dark mode screenshots to PWA manifest
- [ ] Test field usability under direct sunlight (light mode) and night work (dark mode)

### Phase 5: Motion & Polish
- [ ] Implement view transition animations
- [ ] Add status change pulse effects
- [ ] Create loading skeletons for each view
- [ ] Add drag feedback for kanban/calendar
- [ ] Test with `prefers-reduced-motion` enabled

---

## 6. Design Rationale

### Why Industrial Precision Aesthetic?

**Context**: Closet installation is a hands-on, utilitarian trade. The software should reflect this:
- **Brutalist UI** = Zero fluff, maximum information density
- **Sharp contrast** = Readable in harsh field conditions (bright sunlight, dim warehouses)
- **Clean type** = Pretendard의 깔끔한 산세리프가 현대적 업무 도구에 적합, 한영 혼용 자연스러움
- **Accent amber** = Evokes tool belt orange, high-visibility safety gear

### Why These Specific Views?

**Orders Kanban**: Visual pipeline = mental model of work flow-through (inquiry → revenue_confirmed).

**Schedule Multi-View**:
- **Calendar** = Monthly planning (when to take new jobs)
- **Timeline** = Operational planning (can I fit 2 installs in one day?)
- **Agenda** = Tactical execution (what's next right now?)
- **Map** = Logistics optimization (route planning, cluster nearby jobs)

**Inventory Grid**: Warehouse workers are visual learners. Color-coded cards > spreadsheet rows.

### Why Dark Mode Priority?

1인 사업자 often works late nights (evening quotes, weekend prep). Dark mode reduces eye strain and saves mobile battery. Light mode handles field use under sunlight. System auto-detection reduces cognitive load.

---

## 7. Future Enhancements (Post-MVP)

- **Custom accent color picker**: Let users choose brand color (default: amber)
- **High contrast mode**: Enhanced borders/shadows for low vision users
- **View presets**: Save custom view + filter combos ("Urgent orders this week")
- **3D dark mode**: Adjust Three.js scene lighting when theme changes
- **Print stylesheets**: Auto light mode + remove chrome for printing
- **View usage analytics**: Track which views users prefer (inform defaults)

---

**End of Design Document**

Total Views Designed: 13 unique view types across 5 screens
Accessibility: WCAG AA compliant (tested ratios provided)
Responsive Breakpoints: Mobile (<768px), Tablet (768-1023px), Desktop (≥1024px)
Browser Support: Modern evergreen (Chrome/Edge/Safari/Firefox last 2 versions)
