'use client';

import { useState } from 'react';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export function ExportImageButton() {
  const [exporting, setExporting] = useState(false);

  const handleExport = () => {
    setExporting(true);
    try {
      const canvas = document.querySelector('canvas');
      if (!canvas) {
        toast.error('캔버스를 찾을 수 없습니다.');
        return;
      }
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `closet-model-${Date.now()}.png`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('이미지가 다운로드되었습니다.');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('이미지 내보내기에 실패했습니다.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleExport}
      disabled={exporting}
      title="PNG 이미지 내보내기"
      className="h-8"
    >
      <Download className="size-4" />
      <span className="hidden sm:inline text-xs">내보내기</span>
    </Button>
  );
}
