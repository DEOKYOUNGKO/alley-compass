/* 생존 안정성 Score + 개인화 Ranking (프로토타입 로직 이식).
 *
 * ⚠️ 이것은 임시 휴리스틱이다. PRD §7·§14의 예측 모델이 아니다.
 * 실제로는 Temporal Backtest한 LightGBM이 상권×업종 폐업위험을 산출하고,
 * 그 결과에 예산·타깃·선호를 얹어 최종 Ranking을 만든다(PRD §16).
 * 모델이 붙으면 survival()의 raw 계산부가 predictions 테이블 조회로 바뀌고,
 * 예산/선호 보정 부분은 남는다.
 *
 * 경쟁강도에 대하여 — 우리 데이터에는 상권 면적이 없어 "점포수/면적" 밀도를
 * 만들 수 없다. 그래서 면적이 필요 없는 정의를 쓴다.
 *
 *     점포당 배후수요 = 배후수요 지수 / 동종업종 점포수
 *
 * 값이 클수록 점포 하나가 나눠 갖는 수요가 크다 = 경쟁 여유. 서울 골목상권
 * 분포에서의 백분위를 경쟁 점수로 삼는다. 없는 데이터(면적)를 지어내지 않고
 * 가진 데이터(수요·점포수)만으로 계산하는 방식이다.
 *
 * 모든 함수는 순수 함수다 — (상권, 조건)만 받고 전역 state를 읽지 않는다.
 */

import { BIZ } from "../data/businessTypes";
import { clamp } from "./format";
import { percentileOf, mean } from "./stats";

/** 상권 성격/업종 수요 축에 해당하는 기초 지표 */
export function baseMetric(d, key) {
  switch (key) {
    case "foot":
      return d.foot20 * 0.55 + d.foot30 * 0.45;
    case "resident":
      return d.resident;
    case "worker":
      return d.worker;
    case "campus":
      return d.foot20 * 0.7 + d.foot30 * 0.3;
    default:
      return 0;
  }
}

/** 업종 수요축 + 사용자가 고른 상권 성격 + 타깃 연령을 반영한 배후수요 지수 (0~100) */
export function demandOf(d, conditions) {
  const biz = BIZ[conditions.biz];
  let demand = 0.5 * baseMetric(d, biz.demand) + 0.5 * baseMetric(d, conditions.character);
  if (conditions.age === "20") demand = demand * 0.6 + d.foot20 * 0.4;
  if (conditions.age === "30") demand = demand * 0.6 + d.foot30 * 0.4;
  return demand;
}

/** 상권×업종 동종업종 점포수 추정.
 *  실데이터에서는 district_features.store_count 를 그대로 쓴다. */
export function storeCountOf(d, bizKey) {
  const biz = BIZ[bizKey];
  const saturation =
    biz.demand === "foot"
      ? d.sat // 유동 기반 업종은 상권 활성도에 비례해 점포가 들어선다
      : 0.4 * d.resident + 0.2 * (100 - d.foot20) + 20; // 생활밀착 업종은 배후 주거에 비례
  return Math.max(1, Math.round((saturation / 100) * biz.storesAtFull));
}

/**
 * 경쟁 비교의 모집단을 한 번만 만든다.
 * 백분위와 서울 평균은 "다른 상권들과 비교"라서 상권 하나만 보고는 계산할 수 없다.
 */
export function buildCompetitionContext(districts, conditions) {
  const rows = districts.map((d) => {
    const demand = demandOf(d, conditions);
    const stores = storeCountOf(d, conditions.biz);
    return { code: d.code, demand, stores, perStore: demand / stores };
  });
  const perStoreValues = rows.map((r) => r.perStore);
  return {
    byCode: new Map(rows.map((r) => [r.code, r])),
    perStoreValues,
    cityAvgPerStore: mean(perStoreValues),
  };
}

/**
 * 상권 1곳의 생존 안정성 Score와 그 구성요소를 계산한다.
 * @param ctx buildCompetitionContext() 결과 — 경쟁 백분위 계산에 필요하다.
 */
export function survival(d, conditions, ctx) {
  const biz = BIZ[conditions.biz];
  const row = ctx.byCode.get(d.code);

  const demand = row.demand;
  const stores = row.stores;
  const perStore = row.perStore;

  // 경쟁 여유 = 점포당 배후수요의 백분위 (클수록 여유)
  const comp = percentileOf(ctx.perStoreValues, perStore).rankPct;

  const perf = clamp(50 + d.salesTrend * 2.2, 0, 100);
  const stability = clamp(100 - d.closureTrend * 2.1, 0, 100);
  const access = 0.6 * d.transit + 0.4 * d.facilities;

  // 우선순위에 따라 해당 축의 가중치를 키운 뒤 재정규화
  const w = { ...biz.w };
  if (conditions.priority === "survival") w.stability *= 1.35;
  if (conditions.priority === "growth") w.perf *= 1.4;
  if (conditions.priority === "cost") w.comp *= 1.25;
  const sum = w.demand + w.comp + w.perf + w.access + w.stability;
  for (const k in w) w[k] /= sum;

  const raw =
    w.demand * demand + w.comp * comp + w.perf * perf + w.access * access + w.stability * stability;

  // 예상 보증금: 상권 시세 × 업종별 면적 계수 (50만원 단위 반올림)
  const deposit = Math.round((d.deposit * biz.footprint) / 50) * 50;
  const over = deposit - conditions.budget;
  let badj = over <= 0 ? 6 + Math.min(6, -over / 1000) : -Math.min(26, over / 650);
  if (conditions.priority === "cost") badj *= 1.5;

  const surv = clamp(Math.round(0.9 * raw + badj + 8), 30, 95);

  return {
    d,
    surv,
    deposit,
    demand,
    comp,
    perf,
    stability,
    access,
    w,
    // 경쟁 관련 원시값 — 근거 문장·검증 로그·차트가 같은 값을 쓴다
    stores,
    perStore,
    cityAvgPerStore: ctx.cityAvgPerStore,
  };
}

/** 전체 상권을 조건에 맞춰 재랭킹 (PRD §16) */
export function rankDistricts(districts, conditions) {
  const ctx = buildCompetitionContext(districts, conditions);
  return districts.map((d) => survival(d, conditions, ctx)).sort((a, b) => b.surv - a.surv);
}

/** Drawer의 "왜 이 순위인가" 4개 축 (PRD §16 구성요소) */
export function rankingBreakdown(r, conditions) {
  const modelStability = Math.round(0.45 * r.stability + 0.3 * r.perf + 0.25 * r.comp);
  const budgetFit = Math.round(
    clamp(
      r.deposit <= conditions.budget
        ? 86 + Math.min(14, ((conditions.budget - r.deposit) / conditions.budget) * 45)
        : 100 - ((r.deposit - conditions.budget) / conditions.budget) * 150,
      0,
      100
    )
  );
  const customerFit = Math.round(r.demand);
  const preferenceFit =
    conditions.priority === "survival"
      ? modelStability
      : conditions.priority === "cost"
        ? budgetFit
        : Math.round(r.perf);

  return { modelStability, budgetFit, customerFit, preferenceFit };
}

/** Drawer의 "주요 예측 요인" — 기여도 = 가중치 × (값 - 중앙 50) (F-14 자리) */
export function featureContributions(r) {
  const feats = [
    { k: "타깃 고객 수요", v: r.demand, w: r.w.demand },
    { k: "동종업종 경쟁 여유", v: r.comp, w: r.w.comp },
    { k: "매출 추세", v: r.perf, w: r.w.perf },
    { k: "폐업 추세 안정성", v: r.stability, w: r.w.stability },
    { k: "교통·집객 접근성", v: r.access, w: r.w.access },
  ].map((f) => ({ ...f, c: f.w * (f.v - 50) }));

  const max = Math.max(...feats.map((f) => Math.abs(f.c))) || 1;
  feats.sort((a, b) => Math.abs(b.c) - Math.abs(a.c));
  return { feats, max };
}
