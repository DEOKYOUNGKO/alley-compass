/* ──────────────────────────────────────────────────────────────
 * 도메인 타입 — 화면이 다루는 개념들.
 *
 * 문자열 유니온을 쓴 이유: 업종·연령·상권성격·우선순위는 백엔드
 * (backend/schemas.py 의 Literal)와 값이 정확히 일치해야 한다.
 * 오타가 나면 API가 422 를 주는데, 타입으로 막으면 편집기에서 잡힌다.
 * ────────────────────────────────────────────────────────────── */

/** 타깃 연령 — backend AgentRequest.age 와 동일한 값 */
export type AgeTarget = "20" | "30" | "both";

/** 상권 성격 — backend AgentRequest.character 와 동일 */
export type MarketCharacter = "foot" | "resident" | "worker" | "campus";

/** 의사결정 우선순위 — backend AgentRequest.priority 와 동일 */
export type Priority = "survival" | "cost" | "growth";

/** 사용자가 입력한 탐색 조건. App 이 단독으로 소유하는 유일한 state. */
export interface Conditions {
  /** backend 의 business_code. 업종 목록을 받기 전에는 빈 문자열이다. */
  biz: string;
  /** 보증금 상한 (만원) */
  budget: number;
  age: AgeTarget;
  character: MarketCharacter;
  priority: Priority;
}
