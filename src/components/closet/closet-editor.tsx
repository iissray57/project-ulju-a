'use client';

import { useState, useEffect, useCallback } from 'react';
import { Save, Loader2, FolderOpen, Plus, Trash2 } from 'lucide-react';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  createClosetModel,
  updateClosetModel,
  deleteClosetModel,
  getClosetModels,
  getClosetModel,
  type ClosetModelRow,
  type ModelData,
} from '@/app/(dashboard)/closet/model-actions';
import { DEFAULT_EDITOR_STATE, createFrame } from '@/lib/types/closet-editor';

interface ClosetEditorProps {
  orderId?: string;
  modelId?: string;
}

// ── Canvas 썸네일 캡처 ──────────────────────────────────────

function captureCanvasThumbnail(): string | null {
  const canvas = document.querySelector('canvas');
  if (!canvas) return null;
  try {
    return canvas.toDataURL('image/png', 0.8);
  } catch {
    return null;
  }
}

// ── FrameSizeDialog ─────────────────────────────────────────

const FRAME_PRESETS = [
  { label: '소형 (1200×400)', width: 1200, depth: 400 },
  { label: '중형 (1800×600)', width: 1800, depth: 600 },
  { label: '대형 (2400×600)', width: 2400, depth: 600 },
  { label: '와이드 (3000×600)', width: 3000, depth: 600 },
];

function FrameSizeDialog({ onConfirm }: { onConfirm: (w: number, d: number) => void }) {
  const [frameWidth, setFrameWidth] = useState(2400);
  const [frameDepth, setFrameDepth] = useState(600);

  return (
    <Dialog open onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>작업 영역 설정</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <p className="text-sm text-muted-foreground">
            프레임 크기를 설정해주세요. 이 프레임 안에 부품을 배치합니다.
          </p>
          <div className="grid grid-cols-2 gap-2">
            {FRAME_PRESETS.map((p) => (
              <Button
                key={p.label}
                type="button"
                variant={frameWidth === p.width && frameDepth === p.depth ? 'secondary' : 'outline'}
                size="sm"
                className="text-xs"
                onClick={() => { setFrameWidth(p.width); setFrameDepth(p.depth); }}
              >
                {p.label}
              </Button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">가로 (mm)</Label>
              <Input
                type="number"
                value={frameWidth}
                onChange={(e) => setFrameWidth(Number(e.target.value) || 0)}
                min={100}
                max={10000}
                className="h-8"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">세로 (mm)</Label>
              <Input
                type="number"
                value={frameDepth}
                onChange={(e) => setFrameDepth(Number(e.target.value) || 0)}
                min={100}
                max={10000}
                className="h-8"
              />
            </div>
          </div>
          <div className="flex items-center justify-center py-2">
            <div
              className="border-2 border-dashed border-muted-foreground/30 bg-muted/20 flex items-center justify-center"
              style={{
                width: Math.min(200, frameWidth / 15),
                height: Math.min(120, frameDepth / 5),
              }}
            >
              <span className="text-xs text-muted-foreground">{frameWidth}×{frameDepth}mm</span>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={() => onConfirm(frameWidth, frameDepth)} disabled={frameWidth < 100 || frameDepth < 100}>
            시작하기
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── ModelBar (저장/로드/목록) ────────────────────────────────

function ModelBar({
  orderId,
  currentModelId,
  onModelChange,
}: {
  orderId?: string;
  currentModelId: string | null;
  onModelChange: (id: string | null) => void;
}) {
  const state = useEditorState();
  const dispatch = useEditorDispatch();
  const [saving, setSaving] = useState(false);
  const [modelName, setModelName] = useState('');
  const [models, setModels] = useState<ClosetModelRow[]>([]);
  const [showModelList, setShowModelList] = useState(false);
  const [loadingList, setLoadingList] = useState(false);

  // 모델 목록 로드
  const refreshModels = useCallback(async () => {
    if (!orderId) return;
    setLoadingList(true);
    const result = await getClosetModels(orderId);
    if (result.success && result.data) {
      setModels(result.data);
    }
    setLoadingList(false);
  }, [orderId]);

  useEffect(() => { refreshModels(); }, [refreshModels]);

  // 저장
  const handleSave = async () => {
    if (!orderId) {
      toast.error('주문이 연결되지 않았습니다.');
      return;
    }

    setSaving(true);
    try {
      const thumbnail = captureCanvasThumbnail();
      const modelData: ModelData = {
        components: state.components,
        gridSize: state.gridSize,
        version: 1,
      };

      if (currentModelId) {
        // 기존 모델 업데이트
        const result = await updateClosetModel({
          id: currentModelId,
          name: modelName || undefined,
          modelData,
          thumbnailUrl: thumbnail,
        });
        if (result.success) {
          toast.success('모델이 저장되었습니다.');
          refreshModels();
        } else {
          toast.error(result.error || '저장 실패');
        }
      } else {
        // 새 모델 생성
        const name = modelName || `모델 ${models.length + 1}`;
        const result = await createClosetModel({
          orderId,
          name,
          modelData,
          thumbnailUrl: thumbnail,
        });
        if (result.success && result.data) {
          toast.success('새 모델이 저장되었습니다.');
          onModelChange(result.data.id);
          setModelName(result.data.name);
          refreshModels();
        } else {
          toast.error(result.error || '저장 실패');
        }
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '저장 오류');
    } finally {
      setSaving(false);
    }
  };

  // 모델 로드
  const handleLoadModel = async (model: ClosetModelRow) => {
    const data = model.model_data;
    if (data && Array.isArray(data.components)) {
      dispatch({
        type: 'LOAD_STATE',
        payload: {
          ...DEFAULT_EDITOR_STATE,
          components: data.components,
          gridSize: data.gridSize || 50,
        },
      });
      onModelChange(model.id);
      setModelName(model.name);
      setShowModelList(false);
      toast.success(`"${model.name}" 불러옴`);
    }
  };

  // 모델 삭제
  const handleDeleteModel = async (id: string) => {
    const result = await deleteClosetModel(id);
    if (result.success) {
      toast.success('모델 삭제됨');
      if (currentModelId === id) onModelChange(null);
      refreshModels();
    } else {
      toast.error(result.error || '삭제 실패');
    }
  };

  // 새 모델
  const handleNewModel = () => {
    dispatch({ type: 'CLEAR_ALL' });
    onModelChange(null);
    setModelName('');
    setShowModelList(false);
  };

  return (
    <>
      <div className="flex items-center gap-2 border-b px-3 py-1.5 bg-muted/20">
        {orderId ? (
          <>
            <span className="text-xs text-muted-foreground shrink-0">
              주문: {orderId.slice(0, 8)}...
            </span>

            <Input
              value={modelName}
              onChange={(e) => setModelName(e.target.value)}
              placeholder={currentModelId ? '모델명' : '새 모델명'}
              className="h-7 text-xs w-32"
            />

            <Button
              size="sm"
              variant="outline"
              onClick={handleSave}
              disabled={saving}
              className="h-7 gap-1 text-xs shrink-0"
            >
              {saving ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" />}
              {currentModelId ? '저장' : '새로 저장'}
            </Button>

            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowModelList(true)}
              className="h-7 gap-1 text-xs shrink-0"
            >
              <FolderOpen className="size-3.5" />
              목록 ({models.length})
            </Button>
          </>
        ) : (
          <span className="text-xs text-muted-foreground">
            주문 연결 없음 — 주문 상세에서 에디터를 열면 모델을 저장할 수 있습니다
          </span>
        )}
      </div>

      {/* 모델 목록 다이얼로그 */}
      <Dialog open={showModelList} onOpenChange={setShowModelList}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>저장된 모델 ({models.length})</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 max-h-[60vh] overflow-y-auto">
            {loadingList ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="size-5 animate-spin text-muted-foreground" />
              </div>
            ) : models.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                저장된 모델이 없습니다
              </p>
            ) : (
              models.map((m) => (
                <div
                  key={m.id}
                  className={`flex items-center gap-3 rounded-md border p-2 ${
                    m.id === currentModelId ? 'border-primary bg-primary/5' : 'border-border'
                  }`}
                >
                  {/* 썸네일 */}
                  {m.thumbnail_url ? (
                    <img
                      src={m.thumbnail_url}
                      alt={m.name}
                      className="size-14 rounded border object-cover bg-muted shrink-0"
                    />
                  ) : (
                    <div className="size-14 rounded border bg-muted flex items-center justify-center shrink-0">
                      <span className="text-[10px] text-muted-foreground">미리보기</span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{m.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(m.updated_at).toLocaleDateString('ko-KR')}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs"
                      onClick={() => handleLoadModel(m)}
                    >
                      불러오기
                    </Button>
                    <Button
                      size="icon-xs"
                      variant="ghost"
                      className="text-muted-foreground hover:text-destructive"
                      onClick={() => handleDeleteModel(m.id)}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={handleNewModel}>
              <Plus className="size-3.5 mr-1" />새 모델
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ── EditorWithSetup ─────────────────────────────────────────

function EditorWithSetup({ orderId, modelId: initialModelId }: ClosetEditorProps) {
  const state = useEditorState();
  const dispatch = useEditorDispatch();
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);
  const [needsSetup, setNeedsSetup] = useState(false);
  const [currentModelId, setCurrentModelId] = useState<string | null>(initialModelId ?? null);
  const [ready, setReady] = useState(false);

  // 초기 로드
  useEffect(() => {
    let cancelled = false;
    async function init() {
      if (initialModelId) {
        // 특정 모델 로드
        const result = await getClosetModel(initialModelId);
        if (!cancelled && result.success && result.data) {
          const md = result.data.model_data;
          dispatch({
            type: 'LOAD_STATE',
            payload: {
              ...DEFAULT_EDITOR_STATE,
              components: md.components,
              gridSize: md.gridSize || 50,
            },
          });
          setCurrentModelId(result.data.id);
        }
      }
      // 모델이 없으면 프레임 설정 팝업
      if (!cancelled) {
        setNeedsSetup(!initialModelId && state.components.length === 0);
        setReady(true);
      }
    }
    init();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFrameConfirm = (width: number, depth: number) => {
    dispatch({ type: 'ADD_COMPONENT', payload: createFrame(width, depth) });
    setNeedsSetup(false);
  };

  if (!ready) return null;

  return (
    <>
      {needsSetup && <FrameSizeDialog onConfirm={handleFrameConfirm} />}
      <div className="flex h-full flex-col">
        <ModelBar orderId={orderId} currentModelId={currentModelId} onModelChange={setCurrentModelId} />
        <EditorToolbar onOpenMobilePalette={() => setMobileSheetOpen(true)} />
        <div className="flex flex-1 min-h-0">
          <aside className="hidden lg:flex w-[280px] shrink-0">
            <PartsPalette />
          </aside>
          <Sheet open={mobileSheetOpen} onOpenChange={setMobileSheetOpen}>
            <SheetContent side="left" className="w-[280px] p-0">
              <SheetHeader className="sr-only">
                <SheetTitle>부품 팔레트</SheetTitle>
              </SheetHeader>
              <PartsPalette />
            </SheetContent>
          </Sheet>
          <div className="flex-1 min-w-0">
            <ClosetCanvas />
          </div>
        </div>
      </div>
    </>
  );
}

// ── Main Export ──────────────────────────────────────────────

export function ClosetEditor({ orderId, modelId }: ClosetEditorProps) {
  return (
    <EditorProvider>
      <EditorWithSetup orderId={orderId} modelId={modelId} />
    </EditorProvider>
  );
}
