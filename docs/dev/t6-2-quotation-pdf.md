# T6.2 견적서 PDF 템플릿 구현 보고서

**작성일**: 2026-02-14  
**작업자**: executor  
**Sprint**: T6.2

## 완료 항목

### 1. 견적서 PDF 문서 생성 (`src/lib/pdf/quotation-document.tsx`)
- ✅ `generateQuotationDocument()` 함수 구현
- ✅ React.createElement() 사용 (JSX 금지, route handler 호환성)
- ✅ 기존 PDF 컴포넌트 재사용: PDFHeader, PDFFooter, PDFTable, PDFSection, PDFRow, PDFDivider
- ✅ QuotationData 타입 정의

#### 견적서 구성:
1. **헤더**: 견적서 제목, 발행일, 견적번호
2. **고객 정보**: 고객명, 연락처, 주소
3. **수주 정보**: 견적번호, 상태, 설치예정일
4. **자재 목록 테이블**: order_materials 데이터 (품목, 수량, 단가, 소계)
5. **금액 요약**: 소계, 부가세(10%), 총액 (total_amount 기반 계산)
6. **비고**: 견적 유효기간 30일, 참고사항
7. **푸터**: ClosetBiz, 페이지 번호

### 2. Route Handler 수정 (`src/app/api/pdf/route.ts`)
- ✅ `type === 'quotation'` 분기 구현
- ✅ `generateQuotationPDF()` 함수 추가
  - orderId로 수주 + 고객 + 자재 데이터 조회
  - Supabase join이 배열로 반환하는 이슈 해결 (타입 체크 + 타입 단언)
  - renderToBuffer로 PDF 생성
  - 파일명: `견적서_{order_number}.pdf`

### 3. 견적서 다운로드 버튼 (`src/components/orders/quotation-download-button.tsx`)
- ✅ Client Component 구현
- ✅ `/api/pdf?type=quotation&orderId={orderId}` 호출
- ✅ 로딩 상태 표시
- ✅ Blob 다운로드 처리
- ✅ Content-Disposition 헤더에서 파일명 추출

### 4. 수주 상세 페이지 통합
- ✅ `src/app/(dashboard)/orders/[id]/page.tsx`에 버튼 추가
- ✅ 헤더 영역에 "견적서 PDF" 다운로드 버튼 배치

## 주요 결정사항

### 1. React.createElement() 사용
Route handler에서 PDF 생성 시 JSX를 사용하면 TypeScript 타입 체크 오류 발생.
React.createElement()를 사용하여 JSX 없이 컴포넌트 트리 구성.

### 2. Supabase Join 반환 타입 처리
Supabase의 join 쿼리는 단일 객체가 아닌 배열로 반환하는 경우가 있음.
런타임 타입 체크 후 타입 단언을 사용하여 안전하게 처리:
```typescript
const customerData = Array.isArray(orderData.customer)
  ? orderData.customer[0]
  : orderData.customer;

if (!customerData || typeof customerData !== 'object') {
  return { error: '고객 정보를 찾을 수 없습니다.' };
}

const customer = customerData as { name: string; phone: string; address: string };
```

### 3. 금액 계산
- 소계: `order.total_amount`
- 부가세: `Math.round(total_amount * 0.1)`
- 총액: `소계 + 부가세`

### 4. 한글 폰트
현재 Helvetica만 등록되어 있어 한글은 깨질 수 있음.
구조 우선 구현하고 추후 한글 폰트 추가 예정.

## 빌드 검증

```bash
npm run build
```

**결과**: ✅ 성공
- TypeScript 타입 체크 통과
- 모든 LSP 진단 통과 (0 errors, 0 warnings)
- Next.js 빌드 완료

## 추가 수정 사항

### 1. 보고서 목록 컴포넌트 (관련 없는 빌드 오류 수정)
`src/components/reports/report-list.tsx` 구현 누락으로 빌드 실패.
기존 구현이 date-fns import 경로 오류 있었음 → 수정:
```typescript
import { ko } from 'date-fns/locale/ko';
```

### 2. Closet Editor 페이지 (관련 없는 빌드 오류 수정)
`src/app/(dashboard)/closet/editor/page.tsx`가 static 생성 시도하나 cookies 사용으로 실패.
→ `export const dynamic = 'force-dynamic';` 추가

### 3. Parts Palette 타입 오류 수정
`src/components/closet/parts-palette.tsx`에서 unknown 타입을 ReactNode로 사용 시도.
→ `String()` 래핑으로 명시적 타입 변환

## 알려진 이슈

### 1. 한글 폰트 미지원
현재 PDF에서 한글이 제대로 렌더링되지 않을 수 있음 (Helvetica 폰트만 사용).
향후 Noto Sans KR 또는 다른 한글 폰트 추가 필요.

### 2. 자재 데이터 없을 시 빈 테이블 표시
자재가 없는 수주의 경우 빈 테이블이 표시됨.
UX 개선 필요 (예: "등록된 자재가 없습니다" 메시지).

## 다음 단계

1. **T6.3**: 체크리스트 PDF 구현 (이미 구현됨, checklist-document.tsx 존재)
2. **한글 폰트 추가**: Noto Sans KR 등록
3. **PDF 레이아웃 개선**: 로고 추가, 스타일 보강
4. **자재 없는 경우 UX 개선**: 빈 상태 메시지 표시

## 파일 변경 사항

### 신규 파일
- `src/lib/pdf/quotation-document.tsx`
- `src/components/orders/quotation-download-button.tsx`

### 수정 파일
- `src/app/api/pdf/route.ts` (quotation PDF 생성 로직 추가)
- `src/app/(dashboard)/orders/[id]/page.tsx` (다운로드 버튼 추가)
- `src/components/reports/report-list.tsx` (date-fns import 수정)
- `src/app/(dashboard)/closet/editor/page.tsx` (force-dynamic 추가)
- `src/components/closet/parts-palette.tsx` (타입 변환 수정)

## 참고 자료
- @react-pdf/renderer 문서
- 기존 PDF 컴포넌트: `src/lib/pdf/components.tsx`
- 기존 스타일: `src/lib/pdf/styles.ts`
