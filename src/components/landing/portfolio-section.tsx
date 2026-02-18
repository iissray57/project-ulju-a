'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

const CATEGORIES = [
  { id: 'all', label: '전체' },
  { id: 'blind', label: '블라인드' },
  { id: 'curtain', label: '커튼' },
  { id: 'angle', label: '앵글 옷장' },
];

// 임시 포트폴리오 데이터 (실제로는 Supabase에서 가져옴)
const SAMPLE_PORTFOLIOS = [
  {
    id: '1',
    title: '거실 우드블라인드',
    category: 'blind',
    thumbnail: '/images/portfolio/blind-1.jpg',
  },
  {
    id: '2',
    title: '안방 버티컬블라인드',
    category: 'blind',
    thumbnail: '/images/portfolio/blind-2.jpg',
  },
  {
    id: '3',
    title: '거실 암막커튼',
    category: 'curtain',
    thumbnail: '/images/portfolio/curtain-1.jpg',
  },
  {
    id: '4',
    title: '침실 이중커튼',
    category: 'curtain',
    thumbnail: '/images/portfolio/curtain-2.jpg',
  },
  {
    id: '5',
    title: '드레스룸 앵글 옷장',
    category: 'angle',
    thumbnail: '/images/portfolio/angle-1.jpg',
  },
  {
    id: '6',
    title: '다용도실 앵글 선반',
    category: 'angle',
    thumbnail: '/images/portfolio/angle-2.jpg',
  },
];

export function PortfolioSection() {
  const [activeCategory, setActiveCategory] = useState('all');

  const filteredPortfolios =
    activeCategory === 'all'
      ? SAMPLE_PORTFOLIOS
      : SAMPLE_PORTFOLIOS.filter((p) => p.category === activeCategory);

  return (
    <section id="portfolio" className="py-20">
      <div className="mx-auto max-w-6xl px-4">
        {/* Section Header */}
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            시공 사례
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            실제 고객님의 공간에 시공한 사례입니다
          </p>
        </div>

        {/* Category Filter */}
        <div className="mt-10 flex flex-wrap justify-center gap-2">
          {CATEGORIES.map((cat) => (
            <Button
              key={cat.id}
              variant={activeCategory === cat.id ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveCategory(cat.id)}
            >
              {cat.label}
            </Button>
          ))}
        </div>

        {/* Portfolio Grid */}
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredPortfolios.map((item) => (
            <div
              key={item.id}
              className="group relative aspect-[4/3] overflow-hidden rounded-xl bg-slate-200 dark:bg-slate-800"
            >
              {/* Placeholder for actual images */}
              <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <div className="text-4xl">📷</div>
                  <div className="mt-2 text-sm">{item.title}</div>
                </div>
              </div>

              {/* Hover Overlay */}
              <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/70 via-black/20 to-transparent p-4 opacity-0 transition-opacity group-hover:opacity-100">
                <div>
                  <div className="text-sm font-medium text-white">{item.title}</div>
                  <div className="mt-1 text-xs text-white/70">
                    {CATEGORIES.find((c) => c.id === item.category)?.label}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* More Button */}
        <div className="mt-10 text-center">
          <Button variant="outline" size="lg">
            더 많은 사례 보기
          </Button>
        </div>
      </div>
    </section>
  );
}
