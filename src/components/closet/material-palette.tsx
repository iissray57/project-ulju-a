'use client';

import { useEditorDispatch, useEditorState } from './editor-context';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import type { MaterialType } from '@/lib/types/closet-editor';

const MATERIALS: { type: MaterialType; label: string }[] = [
  { type: 'melamine', label: '멜라민' },
  { type: 'mdf', label: 'MDF' },
  { type: 'wood', label: '원목' },
  { type: 'glass', label: '유리' },
];

export function MaterialPalette() {
  const { selectedId, components } = useEditorState();
  const dispatch = useEditorDispatch();

  const selectedComponent = components.find((c) => c.id === selectedId);
  if (!selectedComponent) return null;

  const currentMaterial = selectedComponent.material || 'melamine';
  const currentColor = selectedComponent.color;

  const handleMaterialChange = (material: MaterialType) => {
    dispatch({
      type: 'UPDATE_COMPONENT',
      payload: {
        id: selectedId!,
        changes: { material },
      },
    });
  };

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    dispatch({
      type: 'UPDATE_COMPONENT',
      payload: {
        id: selectedId!,
        changes: { color: e.target.value },
      },
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-sm font-medium mb-2 block">재질</Label>
        <div className="grid grid-cols-2 gap-2">
          {MATERIALS.map((mat) => (
            <Button
              key={mat.type}
              variant={currentMaterial === mat.type ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleMaterialChange(mat.type)}
              className="w-full"
            >
              {mat.label}
            </Button>
          ))}
        </div>
      </div>

      <div>
        <Label className="text-sm font-medium mb-2 block">색상</Label>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={currentColor}
            onChange={handleColorChange}
            className="h-10 w-full rounded-md border border-input cursor-pointer"
          />
          <input
            type="text"
            value={currentColor}
            onChange={handleColorChange}
            className="h-10 w-24 rounded-md border border-input px-3 text-sm"
            placeholder="#000000"
          />
        </div>
      </div>
    </div>
  );
}
