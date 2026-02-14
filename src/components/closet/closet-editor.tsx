'use client';

import { useState } from 'react';
import { EditorProvider } from './editor-context';
import { ClosetCanvas } from './closet-canvas';
import { EditorToolbar } from './editor-toolbar';
import { PartsPalette } from './parts-palette';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import type { ClosetPreset } from '@/app/(dashboard)/closet/actions';

interface ClosetEditorProps {
  userPresets?: ClosetPreset[];
}

export function ClosetEditor({ userPresets = [] }: ClosetEditorProps) {
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);

  return (
    <EditorProvider>
      <div className="flex h-full flex-col">
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
