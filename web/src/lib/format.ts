import type { Tone } from "@/types/ui";

export const clamp = (v: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, v));

/** 천단위 구분. 만원 단위 금액이 대부분이라 소수점은 버린다. */
export const fmt = (n: number): string => Math.round(n).toLocaleString("ko-KR");

export const round1 = (n: number): number => Math.round(n * 10) / 10;

/** 부호를 항상 붙인다 — 증감을 읽을 때 +가 없으면 방향이 안 보인다. */
export const signed = (n: number, digits = 0): string =>
  `${n >= 0 ? "+" : ""}${n.toFixed(digits)}`;

/**
 * 생존 안정성 Score 를 의미색 톤으로. 75 / 60 이 경계다.
 * 화면 어디서든 같은 기준으로 색이 붙게 이 함수만 쓴다.
 */
export function scoreTone(score: number): Extract<Tone, "positive" | "accent" | "negative"> {
  if (score >= 75) return "positive";
  if (score >= 60) return "accent";
  return "negative";
}

/** Score 색을 CSS 변수로. 인라인 style 이 필요한 SVG 텍스트 등에 쓴다. */
export function scoreColorVar(score: number): string {
  if (score >= 75) return "var(--score-high)";
  if (score >= 60) return "var(--score-mid)";
  return "var(--score-low)";
}
