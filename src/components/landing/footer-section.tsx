'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Phone, Mail, MapPin, Clock, ExternalLink } from 'lucide-react';

export function FooterSection() {
  return (
    <footer className="bg-slate-900 text-slate-300">
      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid gap-8 md:grid-cols-3">
          {/* Company Info */}
          <div>
            <Image
              src="/images/logo.png"
              alt="울做앵글"
              width={160}
              height={48}
              className="h-10 w-auto brightness-0 invert opacity-90"
            />
            <p className="mt-4 text-sm leading-relaxed">
              울주 블라인드 / 커튼 전문점<br />
              블라인드, 커튼, 앵글 옷장 맞춤 시공
            </p>
            <p className="mt-3 text-xs text-slate-500">
              대표: 김상권
            </p>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="font-semibold text-white">연락처</h4>
            <ul className="mt-4 space-y-3 text-sm">
              <li className="flex items-center gap-3">
                <Phone className="size-4 text-cyan-400" />
                <a href="tel:010-9373-9033" className="hover:text-white">
                  010-9373-9033
                </a>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="size-4 text-cyan-400" />
                <span className="text-slate-500">FAX: 0504-141-9033</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="size-4 text-cyan-400" />
                <a href="mailto:uljuangle@gmail.com" className="hover:text-white">
                  uljuangle@gmail.com
                </a>
              </li>
              <li className="flex items-center gap-3">
                <MapPin className="size-4 text-cyan-400" />
                <span>울산 언양읍 어음리 120-4</span>
              </li>
              <li className="flex items-center gap-3">
                <Clock className="size-4 text-cyan-400" />
                <span>평일 09:00 - 18:00</span>
              </li>
            </ul>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold text-white">바로가기</h4>
            <ul className="mt-4 space-y-2 text-sm">
              <li>
                <a href="#services" className="hover:text-white">
                  서비스 안내
                </a>
              </li>
              <li>
                <a href="#portfolio" className="hover:text-white">
                  시공 사례
                </a>
              </li>
              <li>
                <a href="#quote-request" className="hover:text-white">
                  견적 상담
                </a>
              </li>
              <li>
                <a
                  href="https://blog.naver.com/uljuangle"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 hover:text-white"
                >
                  네이버 블로그
                  <ExternalLink className="size-3" />
                </a>
              </li>
              <li className="pt-2">
                <Link href="/login" className="text-slate-500 hover:text-slate-400 text-xs">
                  관리자
                </Link>
              </li>
            </ul>

            {/* Bank Info */}
            <div className="mt-6 rounded-lg bg-slate-800 p-3">
              <div className="text-xs text-slate-500 mb-1">입금 계좌</div>
              <div className="text-sm font-medium text-white">농협 301-7272-9033-61</div>
              <div className="text-xs text-slate-400">예금주: 김상권</div>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-12 border-t border-slate-800 pt-6 text-center text-xs text-slate-500">
          © {new Date().getFullYear()} 울做앵글. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
