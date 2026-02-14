'use client';

import { useState } from 'react';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface QuotationDownloadButtonProps {
  orderId: string;
}

/**
 * 견적서 PDF 다운로드 버튼
 */
export function QuotationDownloadButton({ orderId }: QuotationDownloadButtonProps) {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    setIsDownloading(true);

    try {
      const response = await fetch(`/api/pdf?type=quotation&orderId=${orderId}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'PDF 생성에 실패했습니다.');
      }

      // Blob으로 변환
      const blob = await response.blob();

      // Content-Disposition에서 파일명 추출 (또는 기본값 사용)
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = '견적서.pdf';
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="?(.+?)"?$/);
        if (match && match[1]) {
          filename = match[1];
        }
      }

      // 다운로드 트리거
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('PDF 다운로드 오류:', error);
      alert(error instanceof Error ? error.message : 'PDF 다운로드에 실패했습니다.');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Button
      onClick={handleDownload}
      disabled={isDownloading}
      variant="outline"
      size="sm"
    >
      <Download className="mr-2 h-4 w-4" />
      {isDownloading ? '생성 중...' : '견적서 PDF'}
    </Button>
  );
}
