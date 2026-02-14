'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { PresetCard } from '@/components/closet/preset-card';
import { PresetFormDialog } from '@/components/closet/preset-form-dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus } from 'lucide-react';
import { PRESET_CATEGORIES } from '@/lib/schemas/closet-preset';
import {
  deletePreset,
  getPreset,
  type ClosetPreset,
} from '@/app/(dashboard)/closet/actions';
import type { PresetData } from '@/lib/schemas/closet-preset';
import { toast } from 'sonner';

interface PresetsListProps {
  presets: ClosetPreset[];
  initialCategory?: string;
}

export function PresetsList({ presets, initialCategory }: PresetsListProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPresetId, setEditingPresetId] = useState<string | undefined>();
  const [editingPreset, setEditingPreset] = useState<ClosetPreset | undefined>(undefined);

  const currentCategory = initialCategory || 'all';

  const handleCategoryChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === 'all') {
      params.delete('category');
    } else {
      params.set('category', value);
    }
    router.push(`/closet/presets?${params.toString()}`);
  };

  const handleEdit = async (id: string) => {
    const result = await getPreset(id);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    setEditingPresetId(id);
    setEditingPreset(result.data);
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) {
      return;
    }

    const result = await deletePreset(id);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success('프리셋이 삭제되었습니다.');
      router.refresh();
    }
  };

  const handleDialogClose = (open: boolean) => {
    setDialogOpen(open);
    if (!open) {
      setEditingPresetId(undefined);
      setEditingPreset(undefined);
    }
  };

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Tabs value={currentCategory} onValueChange={handleCategoryChange}>
            <TabsList>
              <TabsTrigger value="all">전체</TabsTrigger>
              {PRESET_CATEGORIES.map((cat) => (
                <TabsTrigger key={cat.value} value={cat.value}>
                  {cat.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            새 프리셋
          </Button>
        </div>

        {presets.length === 0 ? (
          <div className="rounded-md border border-dashed p-8 text-center">
            <p className="text-sm text-muted-foreground">프리셋이 없습니다.</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {presets.map((preset) => (
              <PresetCard
                key={preset.id}
                id={preset.id}
                name={preset.name}
                category={preset.category}
                presetData={preset.preset_data as PresetData}
                isSystem={preset.is_system}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>

      <PresetFormDialog
        open={dialogOpen}
        onOpenChange={handleDialogClose}
        presetId={editingPresetId}
        defaultValues={
          editingPreset
            ? {
                name: editingPreset.name,
                category: editingPreset.category,
                preset_data: editingPreset.preset_data as PresetData,
              }
            : undefined
        }
      />
    </>
  );
}
