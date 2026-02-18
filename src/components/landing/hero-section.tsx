'use client';

import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Phone, MessageCircle } from 'lucide-react';

export function HeroSection() {
  const scrollToQuote = () => {
    document.getElementById('quote-request')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="relative bg-gradient-to-br from-slate-800 via-slate-900 to-slate-800 text-white">
      {/* Subtle pattern overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(78,205,196,0.1)_0%,transparent_70%)]" />

      <div className="relative mx-auto max-w-6xl px-4 py-16 sm:py-24">
        <div className="text-center">
          {/* Logo */}
          <div className="mb-8 flex justify-center">
            <Image
              src="/images/logo.png"
              alt="울做앵글 로고"
              width={280}
              height={80}
              className="h-16 w-auto sm:h-20"
              priority
            />
          </div>

          {/* Badge */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-cyan-500/20 px-4 py-2 text-sm backdrop-blur-sm border border-cyan-400/30">
            <span className="size-2 rounded-full bg-cyan-400 animate-pulse" />
            울산 언양 전문 시공
          </div>

          {/* Main Heading */}
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
            <span className="block">블라인드 · 커튼 · 앵글 옷장</span>
            <span className="mt-2 block bg-gradient-to-r from-cyan-400 to-teal-400 bg-clip-text text-transparent">
              맞춤 시공 전문
            </span>
          </h1>

          {/* Subheading */}
          <p className="mx-auto mt-6 max-w-2xl text-base text-slate-300 sm:text-lg">
            울주 블라인드 / 커튼 전문점<br />
            정직한 시공, 합리적인 가격으로 모시겠습니다
          </p>

          {/* CTA Buttons */}
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button
              size="lg"
              onClick={scrollToQuote}
              className="w-full bg-cyan-500 text-white hover:bg-cyan-400 sm:w-auto"
            >
              <MessageCircle className="mr-2 size-5" />
              무료 견적 상담
            </Button>
            <Button
              size="lg"
              variant="outline"
              asChild
              className="w-full border-cyan-400/50 text-cyan-300 hover:bg-cyan-500/20 sm:w-auto"
            >
              <a href="tel:010-9373-9033">
                <Phone className="mr-2 size-5" />
                010-9373-9033
              </a>
            </Button>
          </div>

          {/* Trust Indicators */}
          <div className="mt-16 grid grid-cols-3 gap-6 border-t border-white/10 pt-8">
            <div>
              <div className="text-2xl font-bold text-cyan-400 sm:text-3xl">무료</div>
              <div className="mt-1 text-xs text-slate-400 sm:text-sm">현장 방문 견적</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-cyan-400 sm:text-3xl">A/S</div>
              <div className="mt-1 text-xs text-slate-400 sm:text-sm">책임 시공</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-cyan-400 sm:text-3xl">100%</div>
              <div className="mt-1 text-xs text-slate-400 sm:text-sm">맞춤 제작</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
