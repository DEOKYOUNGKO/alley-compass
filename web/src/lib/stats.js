/* 백분위 계산 — verification_tools.py 의 percentile() 과 같은 정의를 쓴다.
 *
 *   rank_pct = (값이 이 값 이하인 후보 수) / 전체 × 100      … 클수록 상위
 *   top_pct  = 100 - rank_pct                                 … "상위 N%" 표기용
 *
 * 값이 클수록 좋은 지표(유동인구 등)는 top_pct를, 값이 작을수록 좋은 지표
 * (폐업률 등)는 rank_pct를 "상위"로 읽는다. 어느 쪽으로 읽을지는 호출자가
 * 지표의 의미에 맞게 고른다 — 파이썬 Tool과 동일한 규칙이다.
 */

export function percentileOf(values, value) {
  const n = values.length;
  if (!n) return { rankPct: 0, topPct: 100 };
  const atOrBelow = values.filter((v) => v <= value).length;
  const rankPct = (atOrBelow / n) * 100;
  return {
    rankPct: Math.round(rankPct * 10) / 10,
    topPct: Math.round((100 - rankPct) * 10) / 10,
  };
}

export const mean = (values) =>
  values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;

/** "상위 N%" 표기. 0%는 어색하므로 최소 1%로 둔다. */
export const topLabel = (topPct) => `상위 ${Math.max(1, Math.round(topPct))}%`;
