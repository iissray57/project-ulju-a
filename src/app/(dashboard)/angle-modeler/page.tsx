import type { Metadata } from 'next';
import { AngleModeler } from '@/components/angle-modeler/angle-modeler';

export const metadata: Metadata = {
  title: '앵글 모델러',
};

export const dynamic = 'force-dynamic';

export default function AngleModelerPage() {
  return <AngleModeler />;
}
