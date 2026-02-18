'use client';

import { Group, Rect, Arc, Line } from 'react-konva';
import type Konva from 'konva';
import { useEditorV2, type DoorWall } from '../editor-context-v2';
import { ClosetUnitShape } from '../shapes/closet-unit-shape';

// 문 Shape 컴포넌트
function DoorShape() {
  const { state, dispatch, mmToPx, pxToMm, snapToGrid } = useEditorV2();
  const { door, doorSelected, roomWidth, roomDepth } = state;

  const doorWidthPx = mmToPx(door.width);
  const doorThickness = mmToPx(80); // 문 두께 80mm

  // 벽에 따른 위치 계산
  const getPosition = (): { x: number; y: number; rotation: number } => {
    const offsetPx = mmToPx(door.offset);
    switch (door.wall) {
      case 'left':
        return { x: 0, y: offsetPx, rotation: 0 };
      case 'top':
        return { x: offsetPx, y: 0, rotation: 90 };
      case 'right':
        return { x: mmToPx(roomWidth), y: offsetPx, rotation: 180 };
      case 'bottom':
        return { x: offsetPx, y: mmToPx(roomDepth), rotation: -90 };
    }
  };

  const pos = getPosition();

  // 드래그 종료 시 offset 업데이트
  const handleDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
    const node = e.target;
    let newOffset: number;

    if (door.wall === 'left' || door.wall === 'right') {
      newOffset = snapToGrid(pxToMm(node.y()));
      const maxOffset = roomDepth - door.width;
      newOffset = Math.max(0, Math.min(newOffset, maxOffset));
      node.y(mmToPx(newOffset));
      node.x(door.wall === 'left' ? 0 : mmToPx(roomWidth));
    } else {
      newOffset = snapToGrid(pxToMm(node.x()));
      const maxOffset = roomWidth - door.width;
      newOffset = Math.max(0, Math.min(newOffset, maxOffset));
      node.x(mmToPx(newOffset));
      node.y(door.wall === 'top' ? 0 : mmToPx(roomDepth));
    }

    dispatch({ type: 'UPDATE_DOOR', payload: { offset: newOffset } });
  };

  const handleSelect = () => {
    dispatch({ type: 'SELECT_DOOR', payload: true });
    dispatch({ type: 'SELECT_COMPONENT', payload: null });
  };

  // 문 열림 호 (arc) 각도
  const arcAngle = 90;
  const arcRadius = doorWidthPx;

  return (
    <Group
      x={pos.x}
      y={pos.y}
      rotation={pos.rotation}
      draggable
      onDragEnd={handleDragEnd}
      onClick={handleSelect}
      onTap={handleSelect}
    >
      {/* 문틀 */}
      <Rect
        x={0}
        y={-doorThickness / 2}
        width={doorWidthPx}
        height={doorThickness}
        fill="#d4c4a8"
        stroke={doorSelected ? '#1d4ed8' : '#8b7355'}
        strokeWidth={doorSelected ? 2 : 1}
      />

      {/* 문짝 (열린 상태 표시) */}
      {door.isOpen && (
        <>
          {/* 열린 문 */}
          <Rect
            x={0}
            y={door.openDirection === 'inward' ? 0 : -doorWidthPx}
            width={doorThickness * 0.8}
            height={doorWidthPx}
            fill="#f5f0e8"
            stroke="#c4b898"
            strokeWidth={1}
            rotation={door.openDirection === 'inward' ? 45 : -45}
            offsetX={0}
            offsetY={0}
          />
          {/* 열림 호 */}
          <Arc
            x={0}
            y={0}
            innerRadius={0}
            outerRadius={arcRadius}
            angle={arcAngle}
            rotation={door.openDirection === 'inward' ? 0 : -90}
            fill="transparent"
            stroke="#94a3b8"
            strokeWidth={1}
            dash={[4, 4]}
          />
        </>
      )}

      {/* 선택 핸들 */}
      {doorSelected && (
        <>
          <Rect x={-4} y={-4} width={8} height={8} fill="white" stroke="#1d4ed8" strokeWidth={1} cornerRadius={2} />
          <Rect x={doorWidthPx - 4} y={-4} width={8} height={8} fill="white" stroke="#1d4ed8" strokeWidth={1} cornerRadius={2} />
        </>
      )}
    </Group>
  );
}

export function PlanViewLayer() {
  const { state, dispatch } = useEditorV2();
  const { components, selectedId } = state;

  const handleSelect = (id: string) => {
    dispatch({ type: 'SELECT_COMPONENT', payload: id });
  };

  const handleDragEnd = (id: string, x: number, z: number) => {
    dispatch({
      type: 'UPDATE_COMPONENT',
      payload: {
        id,
        updates: { position: [x, 0, z] },
      },
    });
  };

  return (
    <>
      {/* 유닛들 */}
      {components.map((comp) => (
        <ClosetUnitShape
          key={comp.id}
          component={comp}
          isSelected={selectedId === comp.id}
          onSelect={() => handleSelect(comp.id)}
          onDragEnd={(x, z) => handleDragEnd(comp.id, x, z)}
        />
      ))}

      {/* 방 출입문 */}
      <DoorShape />
    </>
  );
}
