'use client';

import { useRef, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

// Dynamic import - react-konva cannot be SSR'd
const KonvaStage = dynamic(() => import('./konva-stage'), {
  ssr: false,
  loading: () => <div className="flex-1 bg-[#F5F5F5]" />,
});

export function FloorPlanCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          setDimensions({ width: Math.floor(width), height: Math.floor(height) });
        }
      }
    });

    observer.observe(el);

    // Set initial size
    const rect = el.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      setDimensions({ width: Math.floor(rect.width), height: Math.floor(rect.height) });
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} className="flex-1 w-full h-full overflow-hidden">
      <KonvaStage width={dimensions.width} height={dimensions.height} />
    </div>
  );
}
