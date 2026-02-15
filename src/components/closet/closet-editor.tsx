'use client';

import { useState, useEffect } from 'react';
import { Save, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { EditorProvider, useEditorState, useEditorDispatch } from './editor-context';
import { ClosetCanvas } from './closet-canvas';
import { EditorToolbar } from './editor-toolbar';
import { PartsPalette } from './parts-palette';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import type { ClosetPreset } from '@/app/(dashboard)/closet/actions';
import { saveClosetModel, loadClosetModel } from '@/app/(dashboard)/closet/model-actions';
import { DEFAULT_EDITOR_STATE } from '@/lib/types/closet-editor';

interface ClosetEditorProps {
  userPresets?: ClosetPreset[];
  orderId?: string;
}

// ── ModelSaveBar (내부 컴포넌트) ─────────────────────────────

function ModelSaveBar({ orderId }: { orderId?: string }) {
  const state = useEditorState();
  const dispatch = useEditorDispatch();
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);

  // Auto-load on mount
  useEffect(() => {
    if (!orderId) return;

    let mounted = true;
    setLoading(true);

    loadClosetModel(orderId)
      .then((result) => {
        if (!mounted) return;
        if (result.success && result.data) {
          dispatch({
            type: 'LOAD_STATE',
            payload: {
              ...DEFAULT_EDITOR_STATE,
              components: result.data.components,
              gridSize: result.data.gridSize,
            },
          });
          toast.success('모델을 불러왔습니다.');
        } else if (!result.success) {
          toast.error(result.error || '모델 불러오기 실패');
        }
      })
      .catch((err) => {
        if (!mounted) return;
        toast.error('모델 불러오기 오류: ' + (err instanceof Error ? err.message : '알 수 없는 오류'));
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [orderId, dispatch]);

  const handleSave = async () => {
    if (!orderId) {
      toast.error('주문이 선택되지 않았습니다.');
      return;
    }

    setSaving(true);
    try {
      const modelData = {
        components: state.components,
        gridSize: state.gridSize,
        version: 1,
      };
      const result = await saveClosetModel(orderId, modelData);
      if (result.success) {
        toast.success('모델이 저장되었습니다.');
      } else {
        toast.error(result.error || '저장 실패');
      }
    } catch (err) {
      toast.error('저장 오류: ' + (err instanceof Error ? err.message : '알 수 없는 오류'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex items-center gap-2 border-b px-3 py-1.5 bg-muted/20">
      {loading ? (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Loader2 className="size-3.5 animate-spin" />
          <span>모델 불러오는 중...</span>
        </div>
      ) : orderId ? (
        <>
          <span className="text-xs text-muted-foreground">
            주문: {orderId.slice(0, 8)}...
          </span>
          <Button
            size="sm"
            variant="outline"
            onClick={handleSave}
            disabled={saving}
            className="h-7 gap-1.5 text-xs"
          >
            {saving ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Save className="size-3.5" />
            )}
            저장
          </Button>
        </>
      ) : (
        <span className="text-xs text-muted-foreground">
          주문을 선택하면 모델을 저장할 수 있습니다
        </span>
      )}
    </div>
  );
}

// ── Main ClosetEditor ───────────────────────────────────────

export function ClosetEditor({ userPresets = [], orderId }: ClosetEditorProps) {
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);

  return (
    <EditorProvider>
      <div className="flex h-full flex-col">
        <ModelSaveBar orderId={orderId} />
        <EditorToolbar onOpenMobilePalette={() => setMobileSheetOpen(true)} />
        <div className="flex flex-1 min-h-0">
          {/* Desktop: 좌측 사이드바 */}
          <aside className="hidden lg:flex w-[280px] shrink-0">
            <PartsPalette userPresets={userPresets} />
          </aside>

          {/* Mobile: Sheet/Drawer */}
          <Sheet open={mobileSheetOpen} onOpenChange={setMobileSheetOpen}>
            <SheetContent side="left" className="w-[280px] p-0">
              <SheetHeader className="sr-only">
                <SheetTitle>부품 팔레트</SheetTitle>
              </SheetHeader>
              <PartsPalette userPresets={userPresets} />
            </SheetContent>
          </Sheet>

          {/* Canvas */}
          <div className="flex-1 min-w-0">
            <ClosetCanvas />
          </div>
        </div>
      </div>
    </EditorProvider>
  );
}
