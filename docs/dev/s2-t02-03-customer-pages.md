# Sprint 2 Task 2.2 + 2.3: 고객 목록/상세 페이지 + 고객 등록/수정 폼

## 완료 일시
2026-02-14

## 구현 내용

### 1. 고객 목록 페이지 (`/customers`)
- **파일**: `src/app/(dashboard)/customers/page.tsx`
- **기능**:
  - 고객 목록 조회 (Server Component)
  - 검색, 페이지네이션 지원
  - 신규 고객 등록 버튼
  - 총 고객 수 표시

### 2. 고객 리스트 컴포넌트
- **파일**: `src/components/customers/customer-list.tsx`
- **기능**:
  - 검색 입력 (debounced 300ms)
  - URL searchParams 기반 검색어, 페이지 상태 관리
  - 반응형 레이아웃:
    - 모바일: 카드 리스트 (이름, 전화, 주소)
    - 데스크탑: 테이블 (이름, 연락처, 주소, 수주건수, 매출)
  - 페이지네이션 (이전/다음 버튼)
  - 빈 상태 처리

### 3. 고객 상세 페이지 (`/customers/[id]`)
- **파일**: `src/app/(dashboard)/customers/[id]/page.tsx`
- **기능**:
  - 고객 기본 정보 표시 (이름, 연락처, 주소, 메모)
  - 수주 통계 카드 (placeholder)
  - 수주 목록 섹션 (placeholder)
  - 수정/목록으로 버튼

### 4. 고객 등록 페이지 (`/customers/new`)
- **파일**: `src/app/(dashboard)/customers/new/page.tsx`
- **기능**:
  - CustomerForm 컴포넌트 사용
  - 신규 고객 등록

### 5. 고객 수정 페이지 (`/customers/[id]/edit`)
- **파일**: `src/app/(dashboard)/customers/[id]/edit/page.tsx`
- **기능**:
  - CustomerForm 컴포넌트에 기존 데이터 전달
  - 고객 정보 수정

### 6. 고객 폼 컴포넌트
- **파일**: `src/components/customers/customer-form.tsx`
- **기능**:
  - react-hook-form + zod 검증 (customerSchema)
  - 필드: name (필수), phone (필수), address, address_detail, memo
  - 생성/수정 모드 자동 처리
  - 에러 표시 (필드별 검증 메시지)
  - 성공 시 toast 알림 + `/customers`로 리디렉트
  - 취소 버튼 (이전 페이지로)

## 추가 작업

### shadcn/ui 컴포넌트 추가
```bash
npx shadcn@latest add table label textarea --yes
```
- Table: 데스크탑 고객 목록 테이블
- Label: 폼 레이블
- Textarea: 메모 입력 필드

### Toaster 설정
- `src/components/ui/sonner.tsx` 수정: `next-themes` 대신 `@/components/providers/theme-provider` 사용
- `src/components/providers/theme-provider.tsx`에 `<Toaster />` 추가
- toast 알림 전역 사용 가능

## 기술 스택 준수

### Server Component 우선
- 목록 페이지, 상세 페이지, 등록/수정 페이지 모두 Server Component
- 데이터 로딩은 server actions 사용

### Client Component (필요 시에만)
- `CustomerForm`: 폼 상태 관리, 검증
- `CustomerList`: 검색 입력, URL 상태, 페이지네이션

### 한국어 UI 텍스트
- 모든 레이블, 버튼, 메시지 한국어
- 에러 메시지 한국어 (zod schema)

### 반응형 레이아웃
- Tailwind CSS 사용
- 모바일: 카드 리스트
- 데스크탑: 테이블

## 수용 기준 충족

### 검색
- [x] 고객명, 연락처, 주소 검색 (actions.ts에서 지원)
- [x] Debounced search (300ms)
- [x] URL searchParams 기반 상태 관리

### 페이지네이션
- [x] 페이지당 20개 항목
- [x] URL searchParams 기반 (page 파라미터)
- [x] 이전/다음 버튼
- [x] 현재 페이지 / 총 페이지 표시

### 폼 검증
- [x] react-hook-form + zod
- [x] 필수 필드 검증 (name, phone)
- [x] 필드별 에러 메시지 표시
- [x] aria-invalid 속성으로 접근성 지원

### CRUD 동작
- [x] 목록 조회 (getCustomers)
- [x] 상세 조회 (getCustomer)
- [x] 생성 (createCustomer)
- [x] 수정 (updateCustomer)
- [x] 삭제 기능은 아직 UI 미구현 (deleteCustomer는 actions.ts에 존재)

## 빌드 검증

```bash
npm run build
```
- TypeScript strict 오류 없음
- ESLint 경고 없음
- 빌드 성공

## 알려진 이슈
없음

## 다음 단계
- Sprint 2 Task 2.4: 수주 목록/상세 페이지 구현
- 고객 상세 페이지의 수주 통계/목록 연동
- 고객 삭제 기능 UI 추가 (확인 다이얼로그)
