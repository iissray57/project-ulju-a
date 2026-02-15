'use client';

import { useState, useTransition } from 'react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale/ko';
import { Download, Trash2, FileText, ListChecks } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import type { SavedReport } from '@/app/(dashboard)/reports/actions';
import { deleteReport, getReportDownloadUrl } from '@/app/(dashboard)/reports/actions';

interface ReportListProps {
  reports: SavedReport[];
}

export function ReportList({ reports }: ReportListProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [reportToDelete, setReportToDelete] = useState<SavedReport | null>(null);
  const [isPending, startTransition] = useTransition();
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const currentType = searchParams.get('type') || 'all';

  const handleTypeChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === 'all') {
      params.delete('type');
    } else {
      params.set('type', value);
    }
    router.push(`/reports?${params.toString()}`);
  };

  const handleDownload = async (report: SavedReport) => {
    setDownloadingId(report.id);
    try {
      const result = await getReportDownloadUrl(report.id);
      if (result.error) {
        toast.error(result.error);
        return;
      }

      // Open download URL in new tab
      window.open(result.data, '_blank');
      toast.success('다운로드를 시작합니다');
    } catch (error) {
      console.error('Download error:', error);
      toast.error('다운로드 중 오류가 발생했습니다');
    } finally {
      setDownloadingId(null);
    }
  };

  const handleDeleteClick = (report: SavedReport) => {
    setReportToDelete(report);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (!reportToDelete) return;

    startTransition(async () => {
      try {
        const result = await deleteReport(reportToDelete.id);
        if (result.error) {
          toast.error(result.error);
          return;
        }

        toast.success('리포트가 삭제되었습니다');
        setDeleteDialogOpen(false);
        setReportToDelete(null);
        router.refresh();
      } catch (error) {
        console.error('Delete error:', error);
        toast.error('삭제 중 오류가 발생했습니다');
      }
    });
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'quotation':
        return <FileText className="h-4 w-4" />;
      case 'checklist':
        return <ListChecks className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'quotation':
        return '견적서';
      case 'checklist':
        return '체크리스트';
      default:
        return type;
    }
  };

  return (
    <>
      <div className="space-y-4">
        {/* Type filter tabs */}
        <Tabs value={currentType} onValueChange={handleTypeChange}>
          <TabsList>
            <TabsTrigger value="all">전체</TabsTrigger>
            <TabsTrigger value="quotation">견적서</TabsTrigger>
            <TabsTrigger value="checklist">체크리스트</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Reports grid */}
        {reports.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center text-muted-foreground">
                저장된 리포트가 없습니다
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {reports.map((report) => (
              <Card key={report.id} className="flex flex-col">
                <CardHeader className="flex-row items-start justify-between space-y-0 pb-3">
                  <div className="flex items-center gap-2">
                    {getTypeIcon(report.type)}
                    <Badge variant="outline">{getTypeLabel(report.type)}</Badge>
                  </div>
                </CardHeader>

                <CardContent className="flex-1 space-y-2">
                  <div>
                    <p className="text-sm font-medium">주문번호</p>
                    <p className="text-sm text-muted-foreground">
                      {report.order_id || '미지정'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">생성일</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(report.created_at), 'PPP', { locale: ko })}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">파일 크기</p>
                    <p className="text-sm text-muted-foreground">
                      {formatFileSize(report.file_size)}
                    </p>
                  </div>
                </CardContent>

                <CardFooter className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={() => handleDownload(report)}
                    disabled={downloadingId === report.id}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    {downloadingId === report.id ? '다운로드 중...' : '다운로드'}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDeleteClick(report)}
                    disabled={isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Delete confirmation dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>리포트 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              이 리포트를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isPending ? '삭제 중...' : '삭제'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
