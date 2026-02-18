import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * 전화번호 포맷: 숫자만 추출 후 XXX-XXXX-XXXX 형태로 변환
 * - 입력 포맷팅 (타이핑 중)과 표시 포맷팅 모두 사용
 */
export function formatPhone(value: string | null | undefined): string {
  if (!value) return '';
  const num = value.replace(/[^\d]/g, '');
  if (num.length <= 3) return num;
  if (num.length <= 7) return `${num.slice(0, 3)}-${num.slice(3)}`;
  return `${num.slice(0, 3)}-${num.slice(3, 7)}-${num.slice(7, 11)}`;
}
