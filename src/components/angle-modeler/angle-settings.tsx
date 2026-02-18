'use client';

import { useAngleModeler } from './angle-context';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import { Plus, Trash2 } from 'lucide-react';

export function AngleSettings() {
  const { state, dispatch, removeShelf, removePost } = useAngleModeler();
  const { width, depth, height, postSize, shelfThickness, color, shelves, posts, selectedShelfId, selectedPostId } = state;

  const updateDimension = (key: 'width' | 'depth' | 'height', value: string) => {
    const num = parseInt(value, 10);
    if (!isNaN(num) && num > 0) {
      dispatch({ type: 'SET_DIMENSION', payload: { [key]: num } });
    }
  };

  return (
    <div className="space-y-5">
      {/* 전체 치수 */}
      <section>
        <h3 className="mb-3 text-sm font-semibold">전체 치수 (mm)</h3>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label className="w-10 text-xs">폭</Label>
            <Input
              type="number"
              value={width}
              onChange={(e) => updateDimension('width', e.target.value)}
              className="h-8 text-xs"
              min={300}
              max={3000}
              step={50}
            />
          </div>
          <div className="flex items-center gap-2">
            <Label className="w-10 text-xs">깊이</Label>
            <Input
              type="number"
              value={depth}
              onChange={(e) => updateDimension('depth', e.target.value)}
              className="h-8 text-xs"
              min={200}
              max={1000}
              step={50}
            />
          </div>
          <div className="flex items-center gap-2">
            <Label className="w-10 text-xs">높이</Label>
            <Input
              type="number"
              value={height}
              onChange={(e) => updateDimension('height', e.target.value)}
              className="h-8 text-xs"
              min={300}
              max={3000}
              step={50}
            />
          </div>
        </div>
      </section>

      <Separator />

      {/* 선반 관리 */}
      <section>
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-semibold">선반 ({shelves.length}개)</h3>
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={() => dispatch({ type: 'ADD_SHELF', payload: { y: Math.round(height / 2) } })}
          >
            <Plus className="mr-1 h-3 w-3" />
            추가
          </Button>
        </div>

        {/* 균등 분배 */}
        <div className="mb-3">
          <Label className="mb-1 block text-xs text-muted-foreground">균등 분배</Label>
          <div className="flex items-center gap-1">
            {[3, 4, 5, 6, 7].map((n) => (
              <Button
                key={n}
                variant={shelves.length === n ? 'default' : 'outline'}
                size="sm"
                className="h-7 w-9 text-xs"
                onClick={() => dispatch({ type: 'DISTRIBUTE_SHELVES', payload: { count: n } })}
              >
                {n}
              </Button>
            ))}
          </div>
        </div>

        {/* 선택된 선반 정보 */}
        {selectedShelfId && (() => {
          const shelf = shelves.find((s) => s.id === selectedShelfId);
          if (!shelf) return null;
          const isEdge = shelf.y === 0 || shelf.y === height;
          return (
            <div className="rounded border bg-blue-50 p-2 text-xs">
              <div className="mb-1 font-medium text-blue-700">선택된 선반</div>
              <div className="flex items-center gap-2">
                <span>높이: {shelf.y}mm</span>
                {!isEdge && (
                  <>
                    <Slider
                      value={[shelf.y]}
                      onValueChange={([v]) =>
                        dispatch({ type: 'MOVE_SHELF', payload: { id: shelf.id, y: v } })
                      }
                      min={0}
                      max={height}
                      step={10}
                      className="flex-1"
                    />
                    <Button
                      variant="destructive"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => removeShelf(shelf.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </>
                )}
                {isEdge && <span className="text-muted-foreground">(고정)</span>}
              </div>
            </div>
          );
        })()}
      </section>

      <Separator />

      {/* 기둥 관리 */}
      <section>
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-semibold">기둥 ({posts.length}개)</h3>
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={() => dispatch({ type: 'ADD_POST', payload: { x: Math.round(width / 2) } })}
          >
            <Plus className="mr-1 h-3 w-3" />
            추가
          </Button>
        </div>

        {/* 선택된 기둥 정보 */}
        {selectedPostId && (() => {
          const post = posts.find((p) => p.id === selectedPostId);
          if (!post) return null;
          const isEdge = post.x === 0 || post.x === width;
          return (
            <div className="rounded border bg-blue-50 p-2 text-xs">
              <div className="mb-1 font-medium text-blue-700">선택된 기둥</div>
              <div className="flex items-center gap-2">
                <span>위치: {post.x}mm</span>
                {!isEdge && (
                  <Button
                    variant="destructive"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => removePost(post.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                )}
                {isEdge && <span className="text-muted-foreground">(고정)</span>}
              </div>
            </div>
          );
        })()}
      </section>

      <Separator />

      {/* 프레임 옵션 */}
      <section>
        <h3 className="mb-3 text-sm font-semibold">프레임 옵션</h3>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label className="w-16 text-xs">기둥 크기</Label>
            <Select
              value={String(postSize)}
              onValueChange={(v) =>
                dispatch({ type: 'SET_OPTION', payload: { postSize: Number(v) } })
              }
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30">30mm</SelectItem>
                <SelectItem value="40">40mm (표준)</SelectItem>
                <SelectItem value="50">50mm</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <Label className="w-16 text-xs">선반 두께</Label>
            <Select
              value={String(shelfThickness)}
              onValueChange={(v) =>
                dispatch({ type: 'SET_OPTION', payload: { shelfThickness: Number(v) } })
              }
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="15">15mm</SelectItem>
                <SelectItem value="20">20mm (표준)</SelectItem>
                <SelectItem value="25">25mm</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <Label className="w-16 text-xs">색상</Label>
            <Select
              value={color}
              onValueChange={(v) =>
                dispatch({ type: 'SET_OPTION', payload: { color: v as 'white' | 'black' | 'silver' } })
              }
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="white">화이트</SelectItem>
                <SelectItem value="black">블랙</SelectItem>
                <SelectItem value="silver">실버</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>
    </div>
  );
}
