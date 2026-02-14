# S6-T6.9: 드래그&드롭 배치 + 치수 표시 + 스냅 그리드

**날짜:** 2026-02-14

---

## 완료 항목

### 드래그&드롭 배치
- `closet-component-mesh.tsx` 전면 리팩토링
- XZ 평면 기반 드래그 이동 (2D/3D 모드 모두 지원)
- Three.js Raycaster + Plane intersection으로 정확한 좌표 변환
- pointer capture로 메시 밖에서도 드래그 계속
- locked 컴포넌트 드래그 차단
- 드래그 중 OrbitControls 자동 비활성화 (isDragging 상태)

### 스냅 그리드
- snapEnabled + gridSize 기반 위치 반올림
- mm → scene unit 변환 (1 unit = 100mm)
- 25mm / 50mm / 100mm 그리드 지원

### 치수 표시
- `dimension-label.tsx` 신규 생성
- @react-three/drei Html 컴포넌트로 3D 공간에 라벨 표시
- W(너비), H(높이), D(깊이) mm 단위 표시
- 선택된 컴포넌트 + showDimensions=true 조건

### EditorState 확장
- `isDragging: boolean` 필드 추가
- `SET_DRAGGING` 액션 추가

---

## 파일 목록

### 신규
- `src/components/closet/dimension-label.tsx`

### 수정
- `src/components/closet/closet-component-mesh.tsx`
- `src/components/closet/closet-canvas.tsx` (DimensionLabel 통합)
- `src/components/closet/editor-context.tsx` (SET_DRAGGING)
- `src/lib/types/closet-editor.ts` (isDragging)

---

**빌드:** ✅ 성공
