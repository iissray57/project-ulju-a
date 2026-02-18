import { useCallback } from 'react';
import { useEditorV2 } from '../editor-context-v2';

export function useSnap() {
  const { state } = useEditorV2();
  const { snapEnabled, gridSize, components } = state;

  const snapToGrid = useCallback(
    (value: number): number => {
      if (!snapEnabled) return value;
      return Math.round(value / gridSize) * gridSize;
    },
    [snapEnabled, gridSize]
  );

  const snapToNearbyComponent = useCallback(
    (
      x: number,
      z: number,
      width: number,
      depth: number,
      excludeId?: string
    ): { x: number; z: number; snappedX: boolean; snappedZ: boolean } => {
      if (!snapEnabled) return { x, z, snappedX: false, snappedZ: false };

      const threshold = 20; // mm
      let snappedX = false;
      let snappedZ = false;
      let resultX = x;
      let resultZ = z;

      for (const comp of components) {
        if (comp.id === excludeId) continue;

        const compX = comp.position[0];
        const compZ = comp.position[2];
        const compWidth = comp.dimensions.width;
        const compDepth = comp.dimensions.depth;

        // Left edge to right edge
        if (Math.abs(x - (compX + compWidth)) < threshold) {
          resultX = compX + compWidth;
          snappedX = true;
        }
        // Right edge to left edge
        if (Math.abs(x + width - compX) < threshold) {
          resultX = compX - width;
          snappedX = true;
        }
        // Left edges align
        if (Math.abs(x - compX) < threshold) {
          resultX = compX;
          snappedX = true;
        }
        // Right edges align
        if (Math.abs(x + width - (compX + compWidth)) < threshold) {
          resultX = compX + compWidth - width;
          snappedX = true;
        }

        // Top edge to bottom edge
        if (Math.abs(z - (compZ + compDepth)) < threshold) {
          resultZ = compZ + compDepth;
          snappedZ = true;
        }
        // Bottom edge to top edge
        if (Math.abs(z + depth - compZ) < threshold) {
          resultZ = compZ - depth;
          snappedZ = true;
        }
        // Top edges align
        if (Math.abs(z - compZ) < threshold) {
          resultZ = compZ;
          snappedZ = true;
        }
        // Bottom edges align
        if (Math.abs(z + depth - (compZ + compDepth)) < threshold) {
          resultZ = compZ + compDepth - depth;
          snappedZ = true;
        }
      }

      return { x: resultX, z: resultZ, snappedX, snappedZ };
    },
    [snapEnabled, components]
  );

  return { snapToGrid, snapToNearbyComponent };
}
