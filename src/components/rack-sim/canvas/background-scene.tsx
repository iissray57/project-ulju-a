'use client';

import type { VirtualBackground } from '../types';

interface BackgroundSceneProps {
  background: VirtualBackground;
  rackCount: number;
}

// Floor plane for all backgrounds
function Floor({ color, size }: { color: string; size: number }) {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
      <planeGeometry args={[size, size]} />
      <meshStandardMaterial color={color} roughness={0.8} metalness={0.05} />
    </mesh>
  );
}

// Wall plane
function Wall({
  color,
  width,
  height,
  position,
  rotation,
}: {
  color: string;
  width: number;
  height: number;
  position: [number, number, number];
  rotation: [number, number, number];
}) {
  return (
    <mesh position={position} rotation={rotation} receiveShadow>
      <planeGeometry args={[width, height]} />
      <meshStandardMaterial color={color} roughness={0.9} metalness={0.02} side={2} />
    </mesh>
  );
}

export function BackgroundScene({ background, rackCount }: BackgroundSceneProps) {
  // Scene dimensions based on rack count
  const sceneWidth = Math.max(4, rackCount * 1.5 + 2);
  const sceneDepth = 5;
  const wallHeight = 2.8;
  const wallColor = '#F5F0E8';
  const backWallX = 0;
  const backWallZ = -sceneDepth / 2;
  const sideWallX = sceneWidth / 2;

  if (background === 'empty') {
    // Perspective stripes: 25 horizontal lines along Z, from near to far
    const stripeCount = 25;
    const stripeDepth = sceneDepth + 4;
    const stripes = Array.from({ length: stripeCount }, (_, i) => {
      const t = i / (stripeCount - 1);
      // Lines spread from z=0 (near) to z=-stripeDepth (far)
      const z = -t * stripeDepth;
      // Lines get lighter toward the far end (perspective fade)
      const brightness = Math.round(0x55 + t * (0xAA - 0x55));
      const hex = brightness.toString(16).padStart(2, '0');
      const lineColor = `#${hex}${hex}${hex}`;
      return { z, lineColor };
    });

    return (
      <>
        {/* Dark studio floor */}
        <Floor color="#333333" size={sceneWidth + 8} />
        {/* Perspective stripe lines on floor */}
        {stripes.map(({ z, lineColor }, i) => (
          <mesh key={`stripe-${i}`} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.002, z]} receiveShadow={false}>
            <planeGeometry args={[sceneWidth + 8, 0.008]} />
            <meshBasicMaterial color={lineColor} />
          </mesh>
        ))}
      </>
    );
  }

  if (background === 'dressing_room') {
    return (
      <>
        {/* Warm wood-toned floor */}
        <Floor color="#C8A96E" size={sceneWidth + 4} />
        {/* Back wall - warm white */}
        <Wall
          color={wallColor}
          width={sceneWidth + 4}
          height={wallHeight + 0.5}
          position={[backWallX, wallHeight / 2, backWallZ]}
          rotation={[0, 0, 0]}
        />
        {/* Side wall - left */}
        <Wall
          color="#EDE8DE"
          width={sceneDepth + 2}
          height={wallHeight + 0.5}
          position={[-sideWallX, wallHeight / 2, 0]}
          rotation={[0, Math.PI / 2, 0]}
        />
        {/* Ambient warm light strip suggestion via emissive plane on ceiling */}
        <mesh position={[0, wallHeight, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <planeGeometry args={[sceneWidth, sceneDepth]} />
          <meshStandardMaterial color="#FFF8E7" emissive="#FFF0C0" emissiveIntensity={0.15} side={2} />
        </mesh>
      </>
    );
  }

  if (background === 'veranda') {
    const halfWallHeight = wallHeight * 0.45;
    return (
      <>
        {/* Tile floor - light grey */}
        <Floor color="#D0CEC8" size={sceneWidth + 4} />
        {/* Back half-wall (railing height) */}
        <Wall
          color="#BCBAB4"
          width={sceneWidth + 4}
          height={halfWallHeight}
          position={[backWallX, halfWallHeight / 2, backWallZ]}
          rotation={[0, 0, 0]}
        />
        {/* Sky / outdoor suggestion - light blue plane far back */}
        <Wall
          color="#B8D4E8"
          width={sceneWidth + 6}
          height={wallHeight + 2}
          position={[backWallX, wallHeight / 2, backWallZ - 1]}
          rotation={[0, 0, 0]}
        />
        {/* Left partial wall */}
        <Wall
          color="#BCBAB4"
          width={halfWallHeight}
          height={halfWallHeight}
          position={[-sideWallX, halfWallHeight / 2, 0]}
          rotation={[0, Math.PI / 2, 0]}
        />
      </>
    );
  }

  if (background === 'laundry_room') {
    return (
      <>
        {/* Tile floor - off-white tile */}
        <Floor color="#E0DDD8" size={sceneWidth + 4} />
        {/* Back wall */}
        <Wall
          color="#E8E5E0"
          width={sceneWidth + 4}
          height={wallHeight + 0.5}
          position={[backWallX, wallHeight / 2, backWallZ]}
          rotation={[0, 0, 0]}
        />
        {/* Left wall */}
        <Wall
          color="#E4E1DC"
          width={sceneDepth + 2}
          height={wallHeight + 0.5}
          position={[-sideWallX, wallHeight / 2, 0]}
          rotation={[0, Math.PI / 2, 0]}
        />
        {/* Right wall */}
        <Wall
          color="#E4E1DC"
          width={sceneDepth + 2}
          height={wallHeight + 0.5}
          position={[sideWallX, wallHeight / 2, 0]}
          rotation={[0, -Math.PI / 2, 0]}
        />
      </>
    );
  }

  return null;
}
