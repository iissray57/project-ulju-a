# S1-T10: 다크모드 기반 구현

## 완료 항목
- `ThemeProvider`: light/dark/system 3모드 지원
- `ThemeToggle`: 드롭다운 메뉴로 테마 전환 (Sun/Moon/Monitor 아이콘)
- `localStorage`로 테마 설정 영속화
- 시스템 설정 변경 실시간 반영 (`prefers-color-scheme` MediaQuery 리스너)
- Header에 ThemeToggle 통합
- Root Layout에 `suppressHydrationWarning` 적용

## 주요 결정사항
- next-themes 대신 자체 ThemeProvider 구현 (경량화)
- CSS class 방식 (`html.dark`/`html.light`)으로 다크모드 전환
- 기본값: system

## 파일
- `src/components/providers/theme-provider.tsx`
- `src/components/ui/theme-toggle.tsx`
- `src/components/layout/header.tsx` (ThemeToggle 통합)
