'use client';

import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows, MeshTransmissionMaterial } from '@react-three/drei';
import * as THREE from 'three';
import { useCurtainModeler } from './curtain-context';

// mm → Three.js 단위 (1 unit = 1m)
const mm = (v: number) => v / 1000;

/** 바닥 (나무 패턴) */
function Floor() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
      <planeGeometry args={[6, 4]} />
      <meshStandardMaterial color="#C4A574" roughness={0.8} metalness={0.05} />
    </mesh>
  );
}

/** 벽 */
function Walls({ roomWidth, roomHeight }: { roomWidth: number; roomHeight: number }) {
  const w = roomWidth;
  const h = roomHeight;

  return (
    <group>
      {/* 뒷벽 (창문이 있는 벽) */}
      <mesh position={[0, h / 2, -1.5]} receiveShadow>
        <planeGeometry args={[w, h]} />
        <meshStandardMaterial color="#F5F0E8" roughness={0.9} />
      </mesh>
      {/* 왼쪽 벽 */}
      <mesh position={[-w / 2, h / 2, -0.25]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[2.5, h]} />
        <meshStandardMaterial color="#EDE8DE" roughness={0.9} />
      </mesh>
      {/* 오른쪽 벽 */}
      <mesh position={[w / 2, h / 2, -0.25]} rotation={[0, -Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[2.5, h]} />
        <meshStandardMaterial color="#EDE8DE" roughness={0.9} />
      </mesh>
    </group>
  );
}

/** 창문 (투명 유리 + 프레임) */
function Window({ width, height, sillHeight }: { width: number; height: number; sillHeight: number }) {
  const w = mm(width);
  const h = mm(height);
  const sy = mm(sillHeight);

  return (
    <group position={[0, sy + h / 2, -1.49]}>
      {/* 유리 */}
      <mesh>
        <planeGeometry args={[w, h]} />
        <MeshTransmissionMaterial
          backside={false}
          thickness={0.02}
          roughness={0.05}
          transmission={0.95}
          ior={1.5}
          chromaticAberration={0.02}
          color="#B8D8F0"
        />
      </mesh>
      {/* 프레임 */}
      {[
        [0, h / 2 + 0.015, 0, w + 0.04, 0.03], // top
        [0, -h / 2 - 0.015, 0, w + 0.04, 0.03], // bottom
        [-w / 2 - 0.015, 0, 0, 0.03, h], // left
        [w / 2 + 0.015, 0, 0, 0.03, h], // right
        [0, 0, 0, 0.02, h], // center vertical
        [0, 0, 0, w, 0.02], // center horizontal
      ].map(([x, y, z, fw, fh], i) => (
        <mesh key={i} position={[x as number, y as number, (z as number) + 0.005]}>
          <planeGeometry args={[fw as number, fh as number]} />
          <meshStandardMaterial color="#8B8B80" metalness={0.3} roughness={0.6} />
        </mesh>
      ))}
      {/* 창대 */}
      <mesh position={[0, -h / 2 - 0.03, 0.04]}>
        <boxGeometry args={[w + 0.08, 0.03, 0.1]} />
        <meshStandardMaterial color="#B8A898" roughness={0.7} />
      </mesh>
    </group>
  );
}

/** 햇살 (체적 광선 효과) */
function Sunlight({ winWidth, winHeight, sillHeight, openRatio, blackoutPercent, curtainStyle }: {
  winWidth: number; winHeight: number; sillHeight: number;
  openRatio: number; blackoutPercent: number; curtainStyle: string;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const w = mm(winWidth);
  const h = mm(winHeight);
  const sy = mm(sillHeight);

  // 암막률에 따라 빛 강도 조절
  const lightBlock = curtainStyle === 'blackout' ? blackoutPercent / 100 : 0.3;
  const lightIntensity = openRatio * 1.0 + (1 - openRatio) * (1 - lightBlock) * 0.6;

  useFrame(() => {
    if (groupRef.current) {
      // 은은하게 흔들리는 햇살
      groupRef.current.rotation.y = Math.sin(Date.now() * 0.0003) * 0.02;
    }
  });

  if (lightIntensity < 0.05) return null;

  return (
    <group ref={groupRef}>
      {/* 볼류메트릭 광선 (반투명 사각형들) */}
      {Array.from({ length: 5 }).map((_, i) => {
        const spread = (i / 4) * 1.2;
        return (
          <mesh
            key={i}
            position={[0, sy + h / 2 - spread * 0.2, -1.4 + spread]}
            rotation={[-0.3, 0, 0]}
          >
            <planeGeometry args={[w * 0.8 * openRatio + w * 0.15, h * 0.6]} />
            <meshBasicMaterial
              color="#FFF8E7"
              transparent
              opacity={lightIntensity * 0.04 * (1 - i * 0.15)}
              side={THREE.DoubleSide}
              depthWrite={false}
              blending={THREE.AdditiveBlending}
            />
          </mesh>
        );
      })}

      {/* 바닥에 비치는 빛 패치 */}
      <mesh position={[0, 0.002, 0.3]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[w * (openRatio * 0.7 + 0.2), 1.2]} />
        <meshBasicMaterial
          color="#FFF0D0"
          transparent
          opacity={lightIntensity * 0.15}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  );
}

/** 커튼 패널 (주름 형태의 메쉬) */
function CurtainPanel({
  width, height, posX, color, opacity, foldCount, isSheer,
}: {
  width: number; height: number; posX: number; color: string;
  opacity: number; foldCount: number; isSheer: boolean;
}) {
  const meshRef = useRef<THREE.Mesh>(null);

  const geometry = useMemo(() => {
    const segX = foldCount * 4;
    const segY = 16;
    const geo = new THREE.PlaneGeometry(width, height, segX, segY);
    const pos = geo.attributes.position;

    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      // 주름 (사인파)
      const foldFreq = (foldCount * Math.PI * 2) / width;
      const foldDepth = 0.015 + (width / foldCount) * 0.08;
      const z = Math.sin(x * foldFreq) * foldDepth;
      // 하단으로 갈수록 약간 펼쳐짐
      const yNorm = (y + height / 2) / height;
      const drape = (1 - yNorm) * 0.01;
      pos.setZ(i, z * (0.7 + yNorm * 0.3) + drape);
    }

    geo.computeVertexNormals();
    return geo;
  }, [width, height, foldCount]);

  // 은은한 흔들림
  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.y = Math.sin(Date.now() * 0.0005) * 0.005;
    }
  });

  return (
    <mesh ref={meshRef} geometry={geometry} position={[posX, height / 2, 0]} castShadow>
      {isSheer ? (
        <meshPhysicalMaterial
          color={color}
          transparent
          opacity={opacity}
          roughness={0.9}
          side={THREE.DoubleSide}
          transmission={0.6}
          thickness={0.5}
        />
      ) : (
        <meshStandardMaterial
          color={color}
          transparent
          opacity={opacity}
          roughness={0.85}
          side={THREE.DoubleSide}
        />
      )}
    </mesh>
  );
}

/** 레일 */
function Rail({ width, y, z }: { width: number; y: number; z: number }) {
  return (
    <group position={[0, y, z]}>
      <mesh castShadow>
        <cylinderGeometry args={[0.012, 0.012, width, 16]} />
        <meshStandardMaterial color="#6B5D4B" metalness={0.5} roughness={0.4} />
      </mesh>
      {/* 양쪽 캡 */}
      <mesh position={[-width / 2, 0, 0]}>
        <sphereGeometry args={[0.018, 12, 12]} />
        <meshStandardMaterial color="#5B4D3B" metalness={0.6} roughness={0.3} />
      </mesh>
      <mesh position={[width / 2, 0, 0]}>
        <sphereGeometry args={[0.018, 12, 12]} />
        <meshStandardMaterial color="#5B4D3B" metalness={0.6} roughness={0.3} />
      </mesh>
    </group>
  );
}

/** 레일을 가로로 눕히기 */
function RailHorizontal({ width, y, z }: { width: number; y: number; z: number }) {
  return (
    <group position={[0, y, z]} rotation={[0, 0, Math.PI / 2]}>
      <Rail width={width} y={0} z={0} />
    </group>
  );
}

/** 블라인드 단일 섹션 */
function BlindPanel3D({
  width, height, posX, posY, posZ, style, slatAngle,
}: {
  width: number; height: number;
  posX: number; posY: number; posZ: number;
  style: string; slatAngle: number;
}) {
  const blindColors: Record<string, { fill: string; rail: string }> = {
    roller:    { fill: '#E8E0D4', rail: '#6B5D4B' },
    venetian:  { fill: '#D4C4A8', rail: '#6B5D4B' },
    vertical:  { fill: '#DDD8D0', rail: '#6B5D4B' },
    honeycomb: { fill: '#E0D8CC', rail: '#6B5D4B' },
    combi:     { fill: '#F0E8DC', rail: '#6B5D4B' },
  };
  const colors = blindColors[style] ?? blindColors.roller;

  if (style === 'roller' || style === 'combi') {
    return (
      <group position={[posX, posY, posZ]}>
        {/* 롤 케이스 */}
        <mesh position={[0, height / 2 + 0.015, 0]} castShadow>
          <cylinderGeometry args={[0.02, 0.02, width, 12]} />
          <meshStandardMaterial color={colors.rail} metalness={0.4} roughness={0.5} />
        </mesh>
        {/* 원단 */}
        <mesh castShadow>
          <planeGeometry args={[width, height]} />
          <meshStandardMaterial
            color={colors.fill}
            roughness={0.85}
            side={THREE.DoubleSide}
            transparent
            opacity={style === 'combi' ? 0.75 : 0.9}
          />
        </mesh>
        {/* 콤비: 줄무늬 */}
        {style === 'combi' && Array.from({ length: Math.floor(height / 0.04) }).map((_, i) => (
          <mesh key={i} position={[0, height / 2 - i * 0.04 - 0.02, 0.001]}>
            <planeGeometry args={[width, 0.005]} />
            <meshBasicMaterial
              color="#C8BCA8"
              transparent
              opacity={i % 2 === 0 ? 0.4 : 0.1}
            />
          </mesh>
        ))}
        {/* 하단바 */}
        <mesh position={[0, -height / 2 - 0.005, 0]}>
          <boxGeometry args={[width * 0.3, 0.008, 0.008]} />
          <meshStandardMaterial color={colors.rail} metalness={0.3} roughness={0.5} />
        </mesh>
      </group>
    );
  }

  if (style === 'vertical') {
    const slatCount = Math.max(3, Math.floor(width / 0.03));
    const slatW = width / slatCount;
    const angleRad = (slatAngle * Math.PI) / 180;

    return (
      <group position={[posX, posY, posZ]}>
        {/* 상단 레일 */}
        <mesh position={[0, height / 2 + 0.008, 0]}>
          <boxGeometry args={[width + 0.01, 0.015, 0.025]} />
          <meshStandardMaterial color={colors.rail} metalness={0.3} roughness={0.5} />
        </mesh>
        {/* 슬랫 */}
        {Array.from({ length: slatCount }).map((_, i) => {
          const x = -width / 2 + slatW * (i + 0.5);
          return (
            <mesh key={i} position={[x, 0, 0]} rotation={[0, angleRad * 0.5, 0]} castShadow>
              <planeGeometry args={[slatW * 0.85, height]} />
              <meshStandardMaterial
                color={colors.fill}
                roughness={0.8}
                side={THREE.DoubleSide}
                transparent
                opacity={0.9}
              />
            </mesh>
          );
        })}
      </group>
    );
  }

  // venetian / honeycomb - 수평 슬랫
  const isHoneycomb = style === 'honeycomb';
  const slatH = isHoneycomb ? 0.018 : 0.006;
  const slatSpacing = isHoneycomb ? 0.022 : 0.015;
  const slatCount = Math.max(3, Math.floor(height / slatSpacing));
  const angleRad = (slatAngle * Math.PI) / 180;

  return (
    <group position={[posX, posY, posZ]}>
      {/* 상단 헤드레일 */}
      <mesh position={[0, height / 2 + 0.008, 0]}>
        <boxGeometry args={[width + 0.01, 0.015, 0.025]} />
        <meshStandardMaterial color={colors.rail} metalness={0.3} roughness={0.5} />
      </mesh>
      {/* 슬랫 */}
      {Array.from({ length: slatCount }).map((_, i) => {
        const y = height / 2 - slatSpacing * (i + 1);
        if (y < -height / 2) return null;
        return (
          <mesh key={i} position={[0, y, 0]} rotation={[angleRad * 0.3, 0, 0]} castShadow>
            {isHoneycomb ? (
              <boxGeometry args={[width, slatH, 0.015]} />
            ) : (
              <boxGeometry args={[width, slatH, 0.002]} />
            )}
            <meshStandardMaterial
              color={colors.fill}
              roughness={0.7}
              side={THREE.DoubleSide}
            />
          </mesh>
        );
      })}
      {/* 하단바 */}
      <mesh position={[0, -height / 2 - 0.005, 0]}>
        <boxGeometry args={[width, 0.008, 0.015]} />
        <meshStandardMaterial color={colors.rail} metalness={0.3} roughness={0.5} />
      </mesh>
    </group>
  );
}

/** 전체 씬 */
function Scene() {
  const { state } = useCurtainModeler();
  const { window: win, config } = state;

  const winW = mm(win.width);
  const winH = mm(win.height);
  const sillH = mm(win.sillHeight);
  const railExt = mm(config.railExtension);
  const railW = winW + railExt * 2;

  const roomHeight = sillH + winH + 0.4;
  const roomWidth = Math.max(railW + 0.8, 3.5);

  // 커튼 높이
  let curtainH: number;
  if (config.curtainLength === 'sill') curtainH = winH;
  else if (config.curtainLength === 'below-sill') curtainH = winH + 0.15;
  else curtainH = winH + sillH - 0.02;

  const railY = sillH + winH + 0.06;

  // 개폐에 따른 커튼 폭
  const closedW = railW;
  const minBundle = 0.12;

  // 스타일별 불투명도
  const styleOpacity: Record<string, number> = {
    drape: 0.92, sheer: 0.35, blackout: 0.98, roman: 0.85, cafe: 0.75,
  };
  const outerOpacity = styleOpacity[config.curtainStyle] ?? 0.85;
  const innerOpacity = styleOpacity[config.innerCurtainStyle] ?? 0.35;
  const isOuterSheer = config.curtainStyle === 'sheer';
  const isInnerSheer = config.innerCurtainStyle === 'sheer';

  const foldCount = Math.round(config.foldMultiplier * 6);

  return (
    <>
      {/* 조명 */}
      <ambientLight intensity={0.35} color="#FFF8F0" />

      {/* 햇살 (창문 뒤에서 오는 빛) */}
      <directionalLight
        position={[0.5, roomHeight, 2]}
        intensity={1.8}
        color="#FFF5E0"
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-far={10}
        shadow-camera-near={0.1}
        shadow-camera-left={-3}
        shadow-camera-right={3}
        shadow-camera-top={3}
        shadow-camera-bottom={-1}
      />

      {/* 창문 뒤 따뜻한 빛 */}
      <pointLight
        position={[0, sillH + winH / 2, -2]}
        intensity={2.5}
        color="#FFE8B0"
        distance={5}
      />

      {/* 실내 간접 조명 */}
      <pointLight position={[1.5, roomHeight - 0.2, 0.5]} intensity={0.3} color="#FFF0E0" distance={4} />

      {/* 방 구조 */}
      <Floor />
      <Walls roomWidth={roomWidth} roomHeight={roomHeight} />
      <Window width={win.width} height={win.height} sillHeight={win.sillHeight} />

      {/* 햇살 효과 */}
      <Sunlight
        winWidth={win.width}
        winHeight={win.height}
        sillHeight={win.sillHeight}
        openRatio={config.openRatio}
        blackoutPercent={config.blackoutPercent}
        curtainStyle={config.curtainStyle}
      />

      {/* 블라인드 */}
      {config.productType === 'blind' && (() => {
        const sections = config.blindSections || 1;
        const totalW = winW;
        const gap = 0.008; // 섹션 간 간격
        const sectionW = (totalW - gap * (sections - 1)) / sections;
        const blindZ = -1.46; // 창문 바로 앞

        return (
          <group>
            {Array.from({ length: sections }).map((_, i) => {
              const x = -totalW / 2 + sectionW / 2 + i * (sectionW + gap);
              return (
                <BlindPanel3D
                  key={i}
                  width={sectionW}
                  height={winH}
                  posX={x}
                  posY={sillH + winH / 2}
                  posZ={blindZ}
                  style={config.blindStyle}
                  slatAngle={config.slatAngle}
                />
              );
            })}
          </group>
        );
      })()}

      {/* 레일 */}
      {config.productType === 'curtain' && (
        <>
          <RailHorizontal width={railW} y={railY} z={config.doubleCurtain ? -1.38 : -1.40} />
          {config.doubleCurtain && (
            <RailHorizontal width={railW} y={railY - 0.03} z={-1.42} />
          )}
        </>
      )}

      {/* 커튼 */}
      {config.productType === 'curtain' && (() => {
        // 창문 바로 앞에 커튼 배치 (벽 z=-1.5, 창 z=-1.49)
        const outerZ = config.doubleCurtain ? -1.38 : -1.40;
        const innerZ = -1.43;

        if (config.splitCenter) {
          const halfClosed = closedW / 2;
          const openW = halfClosed * (1 - config.openRatio) + minBundle * config.openRatio;
          const halfFolds = Math.max(2, Math.ceil(foldCount / 2));

          return (
            <group>
              {/* 속커튼 (항상 닫힘, 뒤쪽) */}
              {config.doubleCurtain && (
                <group position={[0, 0, innerZ]}>
                  <CurtainPanel
                    width={halfClosed} height={curtainH}
                    posX={-halfClosed / 2} color={config.innerCurtainColor}
                    opacity={innerOpacity} foldCount={halfFolds} isSheer={isInnerSheer}
                  />
                  <CurtainPanel
                    width={halfClosed} height={curtainH}
                    posX={halfClosed / 2} color={config.innerCurtainColor}
                    opacity={innerOpacity} foldCount={halfFolds} isSheer={isInnerSheer}
                  />
                </group>
              )}

              {/* 겉커튼 (앞쪽, 개폐 반영) */}
              <group position={[0, 0, outerZ]}>
                <CurtainPanel
                  width={openW} height={curtainH}
                  posX={-railW / 2 + openW / 2} color={config.curtainColor}
                  opacity={outerOpacity} foldCount={halfFolds} isSheer={isOuterSheer}
                />
                <CurtainPanel
                  width={openW} height={curtainH}
                  posX={railW / 2 - openW / 2} color={config.curtainColor}
                  opacity={outerOpacity} foldCount={halfFolds} isSheer={isOuterSheer}
                />
              </group>
            </group>
          );
        }

        // 한개 커튼
        const openW = closedW * (1 - config.openRatio) + minBundle * config.openRatio;
        return (
          <group>
            {/* 속커튼 */}
            {config.doubleCurtain && (
              <group position={[0, 0, innerZ]}>
                <CurtainPanel
                  width={closedW} height={curtainH}
                  posX={0} color={config.innerCurtainColor}
                  opacity={innerOpacity} foldCount={foldCount} isSheer={isInnerSheer}
                />
              </group>
            )}
            {/* 겉커튼 */}
            <group position={[0, 0, outerZ]}>
              <CurtainPanel
                width={openW} height={curtainH}
                posX={-railW / 2 + openW / 2} color={config.curtainColor}
                opacity={outerOpacity} foldCount={foldCount} isSheer={isOuterSheer}
              />
            </group>
          </group>
        );
      })()}

      {/* 바닥 그림자 */}
      <ContactShadows
        position={[0, 0.001, 0]}
        opacity={0.3}
        scale={6}
        blur={2}
        far={3}
      />

      {/* 카메라 컨트롤 */}
      <OrbitControls
        target={[0, roomHeight * 0.45, -0.5]}
        maxPolarAngle={Math.PI / 2}
        minDistance={1}
        maxDistance={6}
        enablePan
      />
    </>
  );
}

export function Curtain3DView() {
  return (
    <div className="w-full h-full rounded-lg overflow-hidden">
      <Canvas
        shadows
        camera={{ position: [0, 1.5, 2.5], fov: 50 }}
        gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.1 }}
      >
        <color attach="background" args={['#1a1a2e']} />
        <fog attach="fog" args={['#2a2a3e', 5, 12]} />
        <Scene />
        <Environment preset="apartment" background={false} environmentIntensity={0.4} />
      </Canvas>
    </div>
  );
}
