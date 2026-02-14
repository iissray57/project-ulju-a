# T2.9 수주 등록/수정 폼 구현 완료

**작업 일자**: 2026-02-14
**작업자**: Sisyphus-Junior (oh-my-claudecode:executor)

## 완료 항목

### 1. 파일 생성
- `src/components/orders/order-form.tsx` - 수주 폼 컴포넌트 (Client Component)
- `src/app/(dashboard)/orders/new/page.tsx` - 수주 등록 페이지 (Server Component)
- `src/app/(dashboard)/orders/[id]/edit/page.tsx` - 수주 수정 페이지 (Server Component)

### 2. UI 컴포넌트 추가
- RadioGroup 컴포넌트 설치 (`npx shadcn@latest add radio-group`)

### 3. 주요 기능

#### 수주 폼 (OrderForm)
1. **고객 선택 섹션**
   - 고객명 debounced 검색 (300ms)
   - 검색 결과 드롭다운
   - 선택된 고객 표시
   - 신규 고객 등록 링크

2. **옷장 사양 섹션**
   - 유형 선택: RadioGroup (앵글/시스템/혼합)
   - Phase 1: closet_type만 입력
   - Phase 2 확장 예정 (2D/3D 모델링)

3. **금액 섹션**
   - 견적 금액 (한국 원화 포맷)
   - 확정 금액 (한국 원화 포맷)

4. **일정 섹션**
   - 실측일 (HTML5 date input)
   - 설치일 (HTML5 date input)

5. **현장 정보**
   - 현장 주소
   - 현장 메모

6. **메모 섹션**
   - 일반 메모

7. **액션 버튼**
   - 취소 (router.back)
   - 저장 (submit)

#### 등록 페이지 (/orders/new)
- 신규 수주 등록 페이지
- OrderForm 컴포넌트 렌더링

#### 수정 페이지 (/orders/[id]/edit)
- 기존 수주 데이터 로드 (getOrder)
- OrderForm에 defaultValues 전달
- customer_id 필수 검증
- closet_type 타입 안전성 보장 (enum validation)
- closet_spec JSON 파싱 (zod safeParse)

## 주요 결정사항

### 1. 스키마 수정
- `orderFormSchema`에서 `.default(0)` 제거
- `quotation_amount`, `confirmed_amount`를 필수 number 타입으로 변경
- 이유: zod의 `.default()`가 타입 추론에서 혼란을 줌

### 2. 고객 검색
- debounced 검색 (300ms delay)
- 최대 10개 결과 표시
- offset: 0, limit: 10 파라미터 사용

### 3. 금액 입력
- 한국 원화 포맷 (toLocaleString('ko-KR'))
- 입력 시 자동 포맷팅
- 저장 시 숫자로 변환

### 4. 날짜 입력
- HTML5 네이티브 date input 사용
- 별도 date picker 라이브러리 미사용 (Phase 1 간소화)

### 5. closet_spec 처리
- Phase 1: 입력 UI 없음 (closet_type만 사용)
- 수정 시 기존 데이터가 있으면 zod safeParse로 검증 후 로드
- Phase 2에서 2D/3D 모델링 UI 추가 예정

## 알려진 이슈

없음. 빌드 에러 0개, TypeScript 에러 0개.

## 다음 단계

T2.10 수주 상세 페이지 구현 진행 예정.

## 테스트 결과

### 빌드 테스트
```bash
npm run build
```
- 결과: ✅ 성공 (0 errors)

### LSP 진단
- order-form.tsx: ✅ No diagnostics
- orders/new/page.tsx: ✅ No diagnostics
- orders/[id]/edit/page.tsx: ✅ No diagnostics

## 참고 사항

- 한국어 UI 텍스트 사용
- 영어 코드/변수명 사용
- react-hook-form + zod 패턴 준수
- toast (sonner) 사용
- Server Component 우선, 필요 시에만 "use client"
