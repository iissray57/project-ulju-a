'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { PencilRuler, Plus, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import {
  getClosetModels,
  deleteClosetModel,
  type ClosetModelRow,
} from '@/app/(dashboard)/closet/model-actions';

interface OrderModelsProps {
  orderId: string;
}

export function OrderModels({ orderId }: OrderModelsProps) {
  const [models, setModels] = useState<ClosetModelRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const result = await getClosetModels(orderId);
    if (result.success && result.data) setModels(result.data);
    setLoading(false);
  };

  useEffect(() => { load(); }, [orderId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`"${name}" 모델을 삭제하시겠습니까?`)) return;
    const result = await deleteClosetModel(id);
    if (result.success) {
      toast.success('삭제됨');
      load();
    } else {
      toast.error(result.error || '삭제 실패');
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <PencilRuler className="size-5" />
          모델링 ({models.length})
        </h2>
        <Button size="sm" variant="outline" asChild>
          <Link href={`/closet/editor?orderId=${orderId}`}>
            <Plus className="size-4 mr-1" />새 모델
          </Link>
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        </div>
      ) : models.length === 0 ? (
        <div className="rounded-md border border-dashed p-6 text-center">
          <p className="text-sm text-muted-foreground mb-3">
            아직 모델이 없습니다. 2D 디자이너에서 배치도를 만들어보세요.
          </p>
          <Button size="sm" variant="outline" asChild>
            <Link href={`/closet/editor?orderId=${orderId}`}>
              <PencilRuler className="size-4 mr-1" />디자이너 열기
            </Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {models.map((m) => (
            <div key={m.id} className="rounded-lg border bg-card overflow-hidden group">
              {/* 썸네일 */}
              <Link href={`/closet/editor?orderId=${orderId}&modelId=${m.id}`}>
                {m.thumbnail_url ? (
                  <img
                    src={m.thumbnail_url}
                    alt={m.name}
                    className="w-full h-32 object-cover bg-muted"
                  />
                ) : (
                  <div className="w-full h-32 bg-muted flex items-center justify-center">
                    <PencilRuler className="size-8 text-muted-foreground/30" />
                  </div>
                )}
              </Link>
              {/* 정보 */}
              <div className="p-3 flex items-center justify-between">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{m.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(m.updated_at).toLocaleDateString('ko-KR')}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button size="xs" variant="ghost" asChild>
                    <Link href={`/closet/editor?orderId=${orderId}&modelId=${m.id}`}>
                      편집
                    </Link>
                  </Button>
                  <Button
                    size="icon-xs"
                    variant="ghost"
                    className="text-muted-foreground hover:text-destructive"
                    onClick={() => handleDelete(m.id, m.name)}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
