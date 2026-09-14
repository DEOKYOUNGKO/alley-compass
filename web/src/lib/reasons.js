/* 추천 근거 / 반대 근거 문장 생성.
 *
 * ⚠️ 지금은 규칙 기반 문장 조립이다. PRD상 이 자리는
 *   pros → Recommendation Agent (Claude)
 *   cons → Risk Agent (Claude, 추천에 반대되는 Evidence를 적극 탐색)
 * 가 각각 생성하고, Verification Agent가 문장 속 수치를 원본 데이터
 * Tool로 대조한 뒤 통과한 것만 화면에 남긴다(PRD §10, §18).
 *
 * Agent를 붙일 때 이 함수의 반환 형태(조각 배열 리스트)를 유지하면
 * 화면 컴포넌트는 그대로 둘 수 있다.
 */

import { BIZ } from "../data/businessTypes";
import { fmt } from "./format";
import { b } from "./rich";

export function reasons(r, conditions) {
  const { d, deposit, stores, perStore, cityAvgPerStore } = r;
  const biz = BIZ[conditions.biz];
  const unit = biz.label;
  // 경쟁강도는 면적 기반 밀도가 아니라 "점포당 배후수요"다 — 클수록 여유. (scoring.js 주석 참고)
  const perStoreShown = Math.round(perStore * 10) / 10;
  const cityAvgShown = Math.round(cityAvgPerStore * 10) / 10;
  const footFacing = biz.demand === "foot";
  const yearlyClosureRate = Math.round((100 - biz.avg3) / 3);
  const closureBase = 2 + Math.round(d.closureTrend * 0.06);

  const pros = [];
  const cons = [];

  if (footFacing && d.foot20 >= 78)
    pros.push([b(`20대 유동인구 상위 ${100 - d.foot20 + 4}%`), " — 서울 골목상권 1,090곳 기준"]);
  if (perStore >= cityAvgPerStore * 1.15)
    pros.push([
      `동종업종 점포 ${stores}개 · 점포당 배후수요 `,
      b(`${perStoreShown}`),
      `, 서울 골목 평균(${cityAvgShown})보다 ${Math.round((perStore / cityAvgPerStore - 1) * 100)}% 높음 — 경쟁 여유`,
    ]);
  if (d.salesTrend >= 5)
    pros.push([`${unit} 추정매출 최근 4개 분기 `, b(`+${d.salesTrend}%`), " 상승 추세"]);
  if (d.closureTrend <= 12)
    pros.push([
      `최근 3년 ${unit} 폐업 `,
      b("안정적"),
      ` (연 ${closureBase}→${closureBase + 1}건)`,
    ]);
  if (!footFacing && d.resident >= 70)
    pros.push(["배후 상주인구 ", b("상위권"), " — 생활밀착 업종 고정수요 확보"]);
  if (biz.demand === "worker" && d.worker >= 58)
    pros.push(["배후 직장인구 두터움 — ", b("평일 점심·오후"), " 수요"]);
  if (d.transit >= 80)
    pros.push([`지하철역 도보 5분 — 교통 접근성 상위 ${100 - d.transit + 6}%`]);
  if (deposit <= conditions.budget)
    pros.push(["예상 보증금 ", b(`${fmt(deposit)}만원`), " — 입력 예산 이내, 초기비용 부담 낮음"]);

  if (perStore <= cityAvgPerStore * 0.85)
    cons.push([
      b("동종업종 과포화"),
      ` — 점포 ${stores}개, 점포당 배후수요 ${perStoreShown} (서울 평균 ${cityAvgShown}). 신규 진입 시 가격 경쟁 불가피`,
    ]);
  if (d.closureTrend >= 22)
    cons.push([
      `최근 2년 ${unit} 폐업 `,
      b(`${closureBase}→${closureBase + 5}건`),
      " 증가세 — 상권 피로 신호",
    ]);
  if (deposit > conditions.budget)
    cons.push([
      "예상 보증금 ",
      b(`${fmt(deposit)}만원`),
      `, 입력 예산(${fmt(conditions.budget)}만원) `,
      b(`${fmt(deposit - conditions.budget)}만원 초과`),
    ]);
  if (d.salesTrend <= -3)
    cons.push([`${unit} 추정매출 최근 4개 분기 `, b(`${d.salesTrend}%`), " 하락 추세"]);
  if (d.weekend)
    cons.push(["주말·관광객 편중 — 평일 오후 유동인구 공백, 고정 매출 예측 어려움"]);
  if (d.nightGap && conditions.biz === "coffee")
    cons.push([b("21시 이후 유동인구 감소"), " — 저녁 매출 의존 업종엔 불리"]);
  if (footFacing && d.foot20 < 45)
    cons.push(["20대 유동인구 ", b("하위권"), " — 트렌드 업종 집객엔 불리"]);
  if (d.transit < 50) {
    cons.push(["지하철역과 거리 있음 — 도보 접근 상권, 상권 범위 좁음"]);
  } else if (footFacing && d.transit < 80) {
    cons.push([b("지하철역 접근성이 상위 추천 상권 대비 낮음"), " — 도보 유입 의존도 큼"]);
  }
  cons.push([
    "첫 창업 공통 리스크 — 이 업종의 최근 3년 서울 평균 폐업률은 연 ",
    b(`${yearlyClosureRate}%`),
    " 수준. 초기 6개월 운영자금 확보 권장",
  ]);

  return { pros: pros.slice(0, 4), cons: cons.slice(0, 3) };
}
