'use client';

import { Blinds, Grid3X3, Shirt } from 'lucide-react';
import { cn } from '@/lib/utils';

const SERVICES = [
  {
    id: 'blind',
    title: '블라인드',
    description: '우드블라인드, 버티컬, 롤스크린 등 다양한 블라인드를 맞춤 시공합니다. 창문 크기에 딱 맞게 제작.',
    icon: Blinds,
    features: ['우드블라인드', '버티컬블라인드', '롤스크린', '콤비블라인드'],
    color: 'bg-cyan-500',
  },
  {
    id: 'curtain',
    title: '커튼',
    description: '암막커튼, 쉬폰커튼, 이중커튼 등 인테리어에 맞는 커튼을 설치해 드립니다.',
    icon: Shirt,
    features: ['암막커튼', '반암막커튼', '쉬폰커튼', '이중커튼'],
    color: 'bg-teal-500',
  },
  {
    id: 'angle',
    title: '앵글 옷장',
    description: '견고한 철재 프레임으로 제작하는 맞춤 옷장. 드레스룸, 창고, 다용도실에 적합합니다.',
    icon: Grid3X3,
    features: ['드레스룸', '팬트리', '다용도실', '창고 선반'],
    color: 'bg-slate-600',
  },
];

export function ServicesSection() {
  return (
    <section id="services" className="bg-slate-50 py-20 dark:bg-slate-900">
      <div className="mx-auto max-w-6xl px-4">
        {/* Section Header */}
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            서비스 안내
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            고객님의 공간과 예산에 맞는 최적의 솔루션을 제안해 드립니다
          </p>
        </div>

        {/* Service Cards */}
        <div className="mt-16 grid gap-8 md:grid-cols-3">
          {SERVICES.map((service) => (
            <div
              key={service.id}
              className="group relative overflow-hidden rounded-2xl bg-white p-8 shadow-sm transition-shadow hover:shadow-lg dark:bg-slate-800"
            >
              {/* Icon */}
              <div
                className={cn(
                  'mb-6 inline-flex size-14 items-center justify-center rounded-xl text-white',
                  service.color
                )}
              >
                <service.icon className="size-7" />
              </div>

              {/* Title & Description */}
              <h3 className="text-xl font-semibold">{service.title}</h3>
              <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                {service.description}
              </p>

              {/* Features */}
              <ul className="mt-6 space-y-2">
                {service.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-sm">
                    <span className={cn('size-1.5 rounded-full', service.color)} />
                    {feature}
                  </li>
                ))}
              </ul>

              {/* Hover Effect */}
              <div
                className={cn(
                  'absolute inset-x-0 bottom-0 h-1 transition-transform origin-left scale-x-0 group-hover:scale-x-100',
                  service.color
                )}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
