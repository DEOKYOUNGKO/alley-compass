/* 업종 마스터 + 업종별 가중치.
 *
 * w: 생존 안정성 Score를 만드는 5개 축의 가중치 (PRD §16 개인화 Ranking).
 *   demand   수요 (유동/상주/직장 인구)
 *   comp     경쟁 여유 (동종업종 밀도의 역수 성격)
 *   perf     최근 매출 추세
 *   access   교통·집객 접근성
 *   stability 폐업 추세 안정성
 *
 * storesAtFull 포화 상권 기준 동종업종 점포수 — 상권별 점포수 추정에 사용.
 *              (기존의 "개/100㎡ 밀도" 상수를 대체한다. 우리 데이터에는 상권
 *               면적이 없어 면적 기반 밀도를 만들 수 없기 때문이다 — 경쟁강도는
 *               lib/scoring.js 에서 "수요 대비 공급"으로 계산한다.)
 * footprint  업종별 필요 면적 계수 — 예상 보증금 추정에 사용
 * avg3       최근 3년 서울 평균 생존율(%) — 공통 리스크 문구에 사용
 *
 * MVP에서는 목업 상수다. 실제로는 business_types 테이블 + 학습된 모델이 대체한다.
 */
export const BIZ = {
  coffee: { label: "커피·음료", demand: "foot", storesAtFull: 46, footprint: 1.0, avg3: 63, w: { demand: 0.34, comp: 0.22, perf: 0.16, access: 0.12, stability: 0.16 } },
  laundry: { label: "세탁·수선", demand: "resident", storesAtFull: 14, footprint: 0.7, avg3: 78, w: { demand: 0.32, comp: 0.22, perf: 0.12, access: 0.08, stability: 0.26 } },
  convenience: { label: "편의점", demand: "foot", storesAtFull: 58, footprint: 1.15, avg3: 71, w: { demand: 0.26, comp: 0.3, perf: 0.14, access: 0.14, stability: 0.16 } },
  korean: { label: "한식·백반", demand: "worker", storesAtFull: 84, footprint: 1.1, avg3: 58, w: { demand: 0.26, comp: 0.22, perf: 0.24, access: 0.12, stability: 0.16 } },
  hair: { label: "미용실", demand: "resident", storesAtFull: 38, footprint: 0.85, avg3: 66, w: { demand: 0.3, comp: 0.22, perf: 0.16, access: 0.12, stability: 0.2 } },
};

export const BIZ_OPTIONS = Object.entries(BIZ).map(([value, b]) => ({ value, label: b.label }));

export const PREF_LABEL = {
  survival: "생존 안정성",
  cost: "예산 적합성",
  growth: "성장 가능성",
};

/* A씨(1순위 페르소나)의 최초 조건 — PRD §6 사용자 시나리오 */
export const INITIAL_CONDITIONS = {
  biz: "coffee",
  budget: 5000,
  age: "both",
  character: "foot",
  priority: "survival",
};
