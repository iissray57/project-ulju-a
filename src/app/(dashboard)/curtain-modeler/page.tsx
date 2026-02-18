import type { Metadata } from 'next';
import { CurtainModeler } from '@/components/curtain-modeler/curtain-modeler';

export const metadata: Metadata = {
  title: '커튼 모델러',
};

export const dynamic = 'force-dynamic';

export default function CurtainModelerPage() {
  return <CurtainModeler />;
}
