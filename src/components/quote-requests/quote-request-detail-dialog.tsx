'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Database } from '@/lib/database.types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { formatPhone } from '@/lib/utils';
import {
  updateQuoteRequestStatus,
  updateQuoteRequestNotes,
  deleteQuoteRequest,
  convertToOrder,
  type QuoteRequestStatus,
} from '@/app/(dashboard)/quote-requests/actions';

type QuoteRequestRow = Database['public']['Tables']['quote_requests']['Row'];

const STATUS_LABELS: Record<string, string> = {
  pending: '대기',
  contacted: '연락완료',
  quoted: '견적발송',
  completed: '완료',
  cancelled: '취소',
};

const STATUS_BADGE_VARIANTS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  contacted: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  quoted: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  completed: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
};

const CATEGORY_LABELS: Record<string, string> = {
  angle: '앵글 옷장',
  curtain: '커튼',
  system: '시스템 수납',
  blind: '블라인드',
};

// 다음 상태 전이 맵
const NEXT_STATUS_MAP: Record<string, QuoteRequestStatus[]> = {
  pending: ['contacted', 'cancelled'],
  contacted: ['quoted', 'cancelled'],
  quoted: ['completed', 'cancelled'],
  completed: [],
  cancelled: [],
};

interface QuoteRequestDetailDialogProps {
  quoteRequest: QuoteRequestRow;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdated?: (updated: QuoteRequestRow) => void;
  onDeleted?: (id: string) => void;
}

export function QuoteRequestDetailDialog({
  quoteRequest,
  open,
  onOpenChange,
  onUpdated,
  onDeleted,
}: QuoteRequestDetailDialogProps) {
  const router = useRouter();
  const [current, setCurrent] = useState<QuoteRequestRow>(quoteRequest);
  const [notes, setNotes] = useState(quoteRequest.admin_notes || '');
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [isChangingStatus, setIsChangingStatus] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const nextStatuses = NEXT_STATUS_MAP[current.status] || [];

  const handleStatusChange = async (status: QuoteRequestStatus) => {
    setIsChangingStatus(true);
    setError(null);
    const result = await updateQuoteRequestStatus(current.id, status);
    if (result.error) {
      setError(result.error);
    } else if (result.data) {
      setCurrent(result.data);
      setNotes(result.data.admin_notes || '');
      onUpdated?.(result.data);
    }
    setIsChangingStatus(false);
  };

  const handleSaveNotes = async () => {
    setIsSavingNotes(true);
    setError(null);
    const result = await updateQuoteRequestNotes(current.id, notes);
    if (result.error) {
      setError(result.error);
    } else if (result.data) {
      setCurrent(result.data);
      onUpdated?.(result.data);
    }
    setIsSavingNotes(false);
  };

  const handleConvertToOrder = async () => {
    if (!confirm('주문으로 전환하시겠습니까? 고객이 없으면 자동 생성됩니다.')) return;
    setIsConverting(true);
    setError(null);
    const result = await convertToOrder(current.id);
    if (result.error) {
      setError(result.error);
      setIsConverting(false);
    } else if (result.data) {
      onOpenChange(false);
      router.push(`/orders/${result.data.orderId}`);
    }
  };

  const handleDelete = async () => {
    if (!confirm('이 견적요청을 삭제하시겠습니까?')) return;
    setIsDeleting(true);
    setError(null);
    const result = await deleteQuoteRequest(current.id);
    if (result.error) {
      setError(result.error);
      setIsDeleting(false);
    } else {
      onDeleted?.(current.id);
      onOpenChange(false);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            견적요청 상세
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_BADGE_VARIANTS[current.status] || ''}`}
            >
              {STATUS_LABELS[current.status] || current.status}
            </span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 pt-2">
          {/* 고객 정보 */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-muted-foreground">고객 정보</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-muted-foreground">이름</span>
                <p className="font-medium">{current.customer_name}</p>
              </div>
              <div>
                <span className="text-muted-foreground">연락처</span>
                <p className="font-medium">{formatPhone(current.customer_phone)}</p>
              </div>
              {current.customer_email && (
                <div className="col-span-2">
                  <span className="text-muted-foreground">이메일</span>
                  <p className="font-medium">{current.customer_email}</p>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* 요청 내용 */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-muted-foreground">요청 내용</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground w-16">카테고리</span>
                <Badge variant="outline">
                  {CATEGORY_LABELS[current.category] || current.category}
                </Badge>
              </div>
              {current.address && (
                <div className="flex gap-2">
                  <span className="text-muted-foreground w-16 shrink-0">주소</span>
                  <p>{current.address}</p>
                </div>
              )}
              {current.description && (
                <div className="flex gap-2">
                  <span className="text-muted-foreground w-16 shrink-0">요청사항</span>
                  <p className="whitespace-pre-wrap">{current.description}</p>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* 타임라인 */}
          <div className="space-y-1 text-xs text-muted-foreground">
            <p>요청일: {formatDate(current.created_at)}</p>
            {current.contacted_at && <p>연락일: {formatDate(current.contacted_at)}</p>}
            {current.completed_at && <p>완료일: {formatDate(current.completed_at)}</p>}
          </div>

          <Separator />

          {/* 관리자 메모 */}
          <div className="space-y-2">
            <Label htmlFor="admin-notes" className="text-sm font-semibold">
              관리자 메모
            </Label>
            <Textarea
              id="admin-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="내부 메모를 입력하세요..."
              rows={3}
              className="text-sm"
            />
            <Button
              size="sm"
              variant="outline"
              onClick={handleSaveNotes}
              disabled={isSavingNotes}
              className="w-full"
            >
              {isSavingNotes ? '저장 중...' : '메모 저장'}
            </Button>
          </div>

          {/* 에러 메시지 */}
          {error && (
            <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md">
              {error}
            </p>
          )}

          {/* 상태 변경 버튼들 */}
          {nextStatuses.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-muted-foreground">상태 변경</h3>
              <div className="flex flex-wrap gap-2">
                {nextStatuses.map((status) => (
                  <Button
                    key={status}
                    size="sm"
                    variant={status === 'cancelled' ? 'destructive' : 'default'}
                    onClick={() => handleStatusChange(status)}
                    disabled={isChangingStatus}
                  >
                    {STATUS_LABELS[status]}으로 변경
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* 주문 전환 */}
          {current.status !== 'cancelled' && current.status !== 'completed' && (
            <Button
              className="w-full"
              onClick={handleConvertToOrder}
              disabled={isConverting}
            >
              {isConverting ? '전환 중...' : '주문으로 전환'}
            </Button>
          )}

          {/* 삭제 */}
          <Button
            variant="outline"
            size="sm"
            className="w-full text-destructive hover:text-destructive"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? '삭제 중...' : '견적요청 삭제'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
