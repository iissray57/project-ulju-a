'use client';

import { EditorProvider } from './editor-context';
import { ClosetCanvas } from './closet-canvas';
import { EditorToolbar } from './editor-toolbar';

export function ClosetEditor() {
  return (
    <EditorProvider>
      <div className="flex h-full flex-col">
        <EditorToolbar />
        <div className="flex-1 min-h-0">
          <ClosetCanvas />
        </div>
      </div>
    </EditorProvider>
  );
}
