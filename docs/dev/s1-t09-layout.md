# S1-T09: 공통 레이아웃

## 완료 항목
- `AppShell`: Sidebar + Header + Content + BottomTabBar 통합 셸
- `Sidebar`: 7개 네비게이션 (대시보드/수주/스케줄/재고/발주/매출/리포트) + 접기 기능
- `Header`: 모바일 햄버거 메뉴 + 로고 + ThemeToggle
- `BottomTabBar`: 모바일 5탭 (홈/수주/+FAB/재고/설정)
- `(dashboard)` 라우트 그룹으로 인증 후 레이아웃 분리
- 반응형: 데스크탑=사이드바, 모바일=하단탭+Sheet 메뉴

## 주요 결정사항
- 모바일 사이드바는 Sheet(바텀시트)로 구현
- FAB(빠른 추가) 버튼은 하단탭 중앙에 배치
- `dvh` 단위로 모바일 뷰포트 대응

## 파일
- `src/components/layout/app-shell.tsx`
- `src/components/layout/sidebar.tsx`
- `src/components/layout/header.tsx`
- `src/components/layout/bottom-tab-bar.tsx`
- `src/app/(dashboard)/layout.tsx`
- `src/app/(dashboard)/page.tsx`
