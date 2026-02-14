'use client';

import { Html } from '@react-three/drei';
import type { ClosetComponent } from '@/lib/types/closet-editor';

interface DimensionLabelProps {
  component: ClosetComponent;
}

const labelStyle: React.CSSProperties = {
  background: 'rgba(37, 99, 235, 0.85)',
  color: '#fff',
  fontSize: '11px',
  fontFamily: 'var(--font-mono, monospace)',
  padding: '2px 6px',
  borderRadius: '3px',
  whiteSpace: 'nowrap',
  pointerEvents: 'none',
  userSelect: 'none',
  lineHeight: '1.4',
};

/**
 * Renders width / height / depth dimension labels around a selected component.
 * Each label is positioned at the midpoint of the corresponding edge.
 */
export function DimensionLabel({ component }: DimensionLabelProps) {
  const w = component.dimensions.width / 100; // scene units
  const h = component.dimensions.height / 100;
  const d = component.dimensions.depth / 100;

  const [cx, cy, cz] = component.position;

  // Small gap so labels don't overlap the mesh edge
  const gap = 0.15;

  return (
    <group>
      {/* Width label -- along X axis, above the top face */}
      <Html
        position={[cx, cy + h / 2 + gap, cz]}
        center
        distanceFactor={8}
        zIndexRange={[10, 0]}
      >
        <div style={labelStyle}>W {component.dimensions.width}mm</div>
      </Html>

      {/* Height label -- along Y axis, to the right */}
      <Html
        position={[cx + w / 2 + gap, cy, cz]}
        center
        distanceFactor={8}
        zIndexRange={[10, 0]}
      >
        <div style={labelStyle}>H {component.dimensions.height}mm</div>
      </Html>

      {/* Depth label -- along Z axis, in front */}
      <Html
        position={[cx, cy, cz + d / 2 + gap]}
        center
        distanceFactor={8}
        zIndexRange={[10, 0]}
      >
        <div style={labelStyle}>D {component.dimensions.depth}mm</div>
      </Html>
    </group>
  );
}
