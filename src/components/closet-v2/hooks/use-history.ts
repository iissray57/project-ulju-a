import { useCallback, useEffect } from 'react';
import { useEditorV2 } from '../editor-context-v2';

export function useHistory() {
  const { state, dispatch } = useEditorV2();
  const { historyIndex, history } = state;

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  const undo = useCallback(() => {
    if (canUndo) {
      dispatch({ type: 'UNDO' });
    }
  }, [canUndo, dispatch]);

  const redo = useCallback(() => {
    if (canRedo) {
      dispatch({ type: 'REDO' });
    }
  }, [canRedo, dispatch]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check if in input field
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      const isMac = navigator.platform.toUpperCase().includes('MAC');
      const cmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;

      if (cmdOrCtrl && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          redo();
        } else {
          undo();
        }
      }

      if (cmdOrCtrl && e.key === 'y') {
        e.preventDefault();
        redo();
      }

      // Delete selected
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (state.selectedId) {
          e.preventDefault();
          dispatch({ type: 'DELETE_COMPONENT', payload: state.selectedId });
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo, state.selectedId, dispatch]);

  return { undo, redo, canUndo, canRedo };
}
