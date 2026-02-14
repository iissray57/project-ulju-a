/**
 * PDF 한글 폰트 등록
 * @react-pdf/renderer는 기본적으로 Helvetica를 사용하며 한글을 지원하지 않음
 * 한글 폰트를 사용하려면 TTF 파일을 로컬에 저장하거나 fetch로 로드해야 함
 * 현재는 기본 폰트를 사용하고 향후 한글 폰트 추가 예정
 */
export function registerPDFKoreanFonts() {
  // TODO: 한글 폰트 등록
  // 1. public/fonts/ 디렉터리에 TTF 파일 추가
  // 2. Font.register({ family: 'Noto Sans KR', src: '/fonts/NotoSansKR-Regular.ttf' })
}

/**
 * PDF 기본 폰트 이름
 * 현재는 내장 폰트 사용 (한글 지원 제한적)
 */
export const PDF_FONT_FAMILY = 'Helvetica';
export const PDF_FALLBACK_FONT = 'Helvetica';
