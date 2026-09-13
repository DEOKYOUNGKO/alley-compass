/* 상권 진단 — 영역별 지수 + 서울 골목상권 내 상위%.
 *
 * 구성은 소상공인 상권분석 서비스들이 공통으로 쓰는 진단 영역 분류를 참고했다
 * (잠재고객 / 경쟁강도 / 영업환경 / 비용). 다만 지표는 전부 우리가 실제로 가진
 * 데이터에서만 만든다 — 보유하지 않은 항목은 값을 지어내지 않고
 * available:false 로 남기고 이유를 적는다 (PRD §20 Unsupported Claim Rate 0%).
 *
 * 비교 기준은 "절대 점수"가 아니라 "서울 골목상권 분포에서의 백분위"다.
 * 계산 정의는 verification_tools.py 의 percentile() 과 동일하다(stats.js 참고).
 *
 * 모집단이 필요하므로 상권 하나가 아니라 랭킹 전체(ranking)를 받는다.
 */

import { percentileOf } from "./stats";

const round1 = (n) => Math.round(n * 10) / 10;

/** ranking에서 지표 하나를 뽑아 모집단 배열로 만든다 */
const column = (ranking, pick) => ranking.map(pick);

export function diagnose(r, ranking, conditions) {
  const d = r.d;

  const pctOf = (pick, value) => percentileOf(column(ranking, pick), value);

  // ── 1. 잠재고객진단 — 유동·상주·직장 배후 수요
  const demandPct = pctOf((x) => x.demand, r.demand);
  const customers = {
    key: "customers",
    label: "잠재고객",
    caption: "유동 · 상주 · 직장 배후 수요",
    available: true,
    score: Math.round(demandPct.rankPct),
    topPct: demandPct.topPct,
    rows: [
      { label: "20대 유동인구", value: `지수 ${d.foot20}`, top: pctOf((x) => x.d.foot20, d.foot20).topPct },
      { label: "30대 유동인구", value: `지수 ${d.foot30}`, top: pctOf((x) => x.d.foot30, d.foot30).topPct },
      { label: "상주인구", value: `지수 ${d.resident}`, top: pctOf((x) => x.d.resident, d.resident).topPct },
      { label: "직장인구", value: `지수 ${d.worker}`, top: pctOf((x) => x.d.worker, d.worker).topPct },
    ],
  };

  // ── 2. 경쟁강도진단 — 수요 대비 공급
  const perStorePct = pctOf((x) => x.perStore, r.perStore);
  const ratioToAvg = r.cityAvgPerStore ? r.perStore / r.cityAvgPerStore : null;
  const competition = {
    key: "competition",
    label: "경쟁강도",
    caption: "수요 대비 공급 — 점포 1개가 나눠 갖는 배후수요",
    available: true,
    score: Math.round(perStorePct.rankPct),
    topPct: perStorePct.topPct,
    rows: [
      { label: "동종업종 점포수", value: `${r.stores}개` },
      { label: "점포당 배후수요", value: round1(r.perStore), top: perStorePct.topPct },
      {
        label: "서울 골목 평균 대비",
        value: ratioToAvg === null ? "—" : `평균의 ${Math.round(ratioToAvg * 100)}%`,
      },
    ],
    note: "상권 면적 데이터가 없어 '점포수/면적' 밀도 대신 수요 대비 공급으로 계산했다.",
  };

  // ── 3. 영업환경진단 — 매출 수준·추세, 폐업 추세, 접근성
  const envRaw = (x) => 0.4 * x.perf + 0.35 * x.stability + 0.25 * x.access;
  const envPct = pctOf(envRaw, envRaw(r));
  const environment = {
    key: "environment",
    label: "영업환경",
    caption: "매출 · 폐업 추세 · 집객/교통 접근성",
    available: true,
    score: Math.round(envPct.rankPct),
    topPct: envPct.topPct,
    rows: [
      {
        label: "추정매출 수준",
        value: `${d.salesBase.toLocaleString("en-US")}만원/월`,
        top: pctOf((x) => x.d.salesBase, d.salesBase).topPct,
      },
      {
        label: "매출 추세 (4분기)",
        value: `${d.salesTrend >= 0 ? "+" : ""}${d.salesTrend}%`,
        top: pctOf((x) => x.d.salesTrend, d.salesTrend).topPct,
      },
      {
        label: "폐업 추세 안정성",
        value: `지수 ${Math.round(r.stability)}`,
        top: pctOf((x) => x.stability, r.stability).topPct,
      },
      {
        label: "교통 · 집객 접근성",
        value: `지수 ${Math.round(r.access)}`,
        top: pctOf((x) => x.access, r.access).topPct,
      },
    ],
  };

  // ── 4. 비용진단 — 보유하지 않은 데이터
  const cost = {
    key: "cost",
    label: "비용",
    caption: "임차료 · 공실률",
    available: false,
    rows: [
      { label: "예상 보증금", value: `${r.deposit.toLocaleString("en-US")}만원`, unverified: true },
      { label: "월 임차료", value: "미보유" },
      { label: "공실률", value: "미보유" },
    ],
    note:
      "서울시 상권분석 5종 데이터셋에는 임차료·공실률이 없다. 예상 보증금은 검증된 값이 " +
      "아니라 외부 추정치이므로 예산 비교의 산술만 검증된다. 실측을 붙이려면 부동산원 " +
      "상업용 부동산 임대조사를 상권_코드에 매핑하는 단계가 필요하다.",
  };

  return [customers, competition, environment, cost];
}
