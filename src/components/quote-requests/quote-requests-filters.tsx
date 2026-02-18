'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

type QuoteRequestStatus = 'pending' | 'contacted' | 'quoted' | 'completed' | 'cancelled';

const STATUS_TABS: { value: QuoteRequestStatus | ''; label: string }[] = [
  { value: '', label: '전체' },
  { value: 'pending', label: '대기' },
  { value: 'contacted', label: '연락완료' },
  { value: 'quoted', label: '견적발송' },
  { value: 'completed', label: '완료' },
  { value: 'cancelled', label: '취소' },
];

interface QuoteRequestsFiltersProps {
  currentStatus?: string;
  currentSearch?: string;
}

export function QuoteRequestsFilters({ currentStatus = '', currentSearch = '' }: QuoteRequestsFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const updateParams = useCallback(
    (updates: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([key, value]) => {
        if (value) {
          params.set(key, value);
        } else {
          params.delete(key);
        }
      });
      // 필터 변경 시 페이지 리셋
      params.delete('page');
      router.push(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams]
  );

  return (
    <div className="space-y-3">
      {/* 상태 탭 */}
      <div className="flex gap-1 overflow-x-auto pb-1">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => updateParams({ status: tab.value })}
            className={cn(
              'shrink-0 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
              currentStatus === tab.value
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 검색 */}
      <Input
        placeholder="고객명 또는 연락처 검색..."
        defaultValue={currentSearch}
        onChange={(e) => {
          const value = e.target.value;
          // debounce 없이 Enter로만 검색 (간단한 구현)
          if (!value) updateParams({ q: '' });
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            updateParams({ q: (e.target as HTMLInputElement).value });
          }
        }}
        className="max-w-sm"
      />
    </div>
  );
}
