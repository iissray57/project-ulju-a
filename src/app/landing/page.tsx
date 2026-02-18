import { HeroSection } from '@/components/landing/hero-section';
import { ServicesSection } from '@/components/landing/services-section';
import { PortfolioSection } from '@/components/landing/portfolio-section';
import { QuoteRequestSection } from '@/components/landing/quote-request-section';
import { FooterSection } from '@/components/landing/footer-section';

export const metadata = {
  title: '울주앵글 - 맞춤 옷장 전문',
  description: '앵글 옷장, 시스템 옷장, 커튼 설치 전문. 무료 견적 상담.',
};

export default function LandingPage() {
  return (
    <main>
      <HeroSection />
      <ServicesSection />
      <PortfolioSection />
      <QuoteRequestSection />
      <FooterSection />
    </main>
  );
}
