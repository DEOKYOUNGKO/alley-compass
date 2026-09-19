/** 디자인 시스템 전역에서 공유하는 크기·톤 어휘.
 *  컴포넌트마다 제각기 다른 이름을 쓰면 조합할 때 매번 헷갈린다. */

export type Size = "sm" | "md" | "lg";

/** 의미색 톤. tokens.semantic.css 의 역할 이름과 1:1로 맞춘다. */
export type Tone = "neutral" | "accent" | "positive" | "caution" | "negative" | "nodata";
