'use client';

import { useState } from 'react';
import { Download, Copy, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { getOutsourceOrder } from '@/app/(dashboard)/orders/outsource-actions';

interface OutsourceOrderPDFButtonProps {
  outsourceOrderId: string;
  outsourceNumber: string;
}

const OUTSOURCE_TYPE_LABELS: Record<string, string> = {
  system: '시스템장',
  curtain: '커튼',
};

function formatAmount(amount: number | null | undefined): string {
  if (amount == null) return '0원';
  return `${amount.toLocaleString('ko-KR')}원`;
}

export function OutsourceOrderPDFButton({
  outsourceOrderId,
  outsourceNumber,
}: OutsourceOrderPDFButtonProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [isCopying, setIsCopying] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const url = `/api/pdf?type=outsource&outsourceOrderId=${outsourceOrderId}`;
      const res = await fetch(url);
      if (!res.ok) {
        console.error('[OutsourceOrderPDFButton] PDF 다운로드 실패:', res.status);
        toast.error('PDF 다운로드에 실패했습니다.');
        return;
      }
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = objectUrl;
      a.download = `발주서_${outsourceNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(objectUrl);
    } catch (err) {
      console.error('[OutsourceOrderPDFButton] PDF 다운로드 오류:', err);
      toast.error('PDF 다운로드에 실패했습니다.');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleCopy = async () => {
    setIsCopying(true);
    try {
      const result = await getOutsourceOrder(outsourceOrderId);
      if (result.error || !result.data) {
        console.error('[OutsourceOrderPDFButton] 데이터 조회 실패:', result.error);
        toast.error('클립보드 복사에 실패했습니다.');
        return;
      }
      const d = result.data;
      const typeLabel = OUTSOURCE_TYPE_LABELS[d.outsource_type] ?? d.outsource_type;
      const supplierName = d.supplier?.name ?? '-';
      const spec = d.spec_summary ?? '-';
      const memoText = d.memo ?? '-';
      const amountText = formatAmount(d.amount);
      const dueDateText = d.due_date ? d.due_date.slice(0, 10) : '-';

      const text = [
        '[외주 발주서]',
        `발주번호: ${d.outsource_number}`,
        `유형: ${typeLabel}`,
        `거래처: ${supplierName}`,
        `스펙: ${spec}`,
        `메모: ${memoText}`,
        `금액: ${amountText}`,
        `납기: ${dueDateText}`,
      ].join('\n');

      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success('클립보드에 복사되었습니다.');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('[OutsourceOrderPDFButton] 클립보드 복사 오류:', err);
      toast.error('클립보드 복사에 실패했습니다.');
    } finally {
      setIsCopying(false);
    }
  };

  return (
    <div className="flex gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={handleDownload}
        disabled={isDownloading}
      >
        {isDownloading ? (
          <Loader2 className="mr-1 h-4 w-4 animate-spin" />
        ) : (
          <Download className="mr-1 h-4 w-4" />
        )}
        발주서 PDF
      </Button>

      <Button
        variant="outline"
        size="sm"
        onClick={handleCopy}
        disabled={isCopying}
      >
        {isCopying ? (
          <Loader2 className="mr-1 h-4 w-4 animate-spin" />
        ) : copied ? (
          <Check className="mr-1 h-4 w-4" />
        ) : (
          <Copy className="mr-1 h-4 w-4" />
        )}
        복사
      </Button>
    </div>
  );
}
