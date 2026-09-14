/* 검증 에이전트 로그 (PRD §10.3, §11).
 *
 * ⚠️ 지금 여기서 만드는 로그는 "검증이 이렇게 돌아간다"를 보여주는 시연용
 * 재현이다. 실제 판정은 alley_compass_etl/verification_tools.py 의 6개 Tool이
 * 원본 데이터프레임을 상대로 수행하며, 결과는 verification_claims 테이블에
 * 쌓인다. 백엔드가 붙으면 이 함수는 그 테이블 조회로 대체된다.
 *
 * 구조는 실제 흐름 그대로다 — 1차 생성 문장 중 하나가 허용오차를 넘겨
 * 반려되고 완화된 표현으로 정정되며, 나머지는 PASS로 남는다.
 */

import { BIZ } from "../data/businessTypes";
import { fmt } from "./format";

const round1 = (n) => Math.round(n * 10) / 10;

export function verificationLog(r, conditions, numericClaimCount) {
  const d = r.d;
  const biz = BIZ[conditions.biz];
  const access = 0.6 * d.transit + 0.4 * d.facilities;

  // 반려 → 정정 사례 1건 (Assertion Validator가 허용오차 초과로 걸러낸 것)
  let corrected;
  if (d.salesTrend >= 5) {
    corrected = {
      claim: `최근 4개 분기 ${biz.label} 추정매출 +${d.salesTrend}%`,
      tool: "Trend Calculator",
      note: `계산값 +${(d.salesTrend - 2.2).toFixed(1)}% · 허용오차(±1%p) 초과 → 재생성 후 “+약 ${Math.round(d.salesTrend / 2) * 2}%”로 완화`,
    };
  } else if (biz.demand === "foot" && d.foot20 >= 78) {
    corrected = {
      claim: `20대 유동인구 상위 ${100 - d.foot20 + 2}%`,
      tool: "Percentile Tool",
      note: `계산값 상위 ${(100 - d.foot20 + 0.3).toFixed(1)}% · 데이터와 불일치 → 재생성 후 “상위 약 ${Math.round((100 - d.foot20) / 5) * 5 + 5}%”`,
    };
  } else {
    const p = Math.round(100 - access);
    corrected = {
      claim: `교통·집객 접근성 상위 ${p - 3}%`,
      tool: "Percentile Tool",
      note: `계산값 상위 ${(p + 2.3).toFixed(1)}% · 반올림 오차 → “상위 약 ${Math.round(p / 5) * 5}%”로 완화`,
    };
  }

  const passed = [
    {
      claim: `동종업종 점포 ${r.stores}개 · 점포당 배후수요 ${round1(r.perStore)} (서울 평균 ${round1(r.cityAvgPerStore)})`,
      tool: "Competition Density Tool",
      real:
        `이 상권 ${round1(r.perStore)} / 서울 평균 ${round1(r.cityAvgPerStore)} → ` +
        `${r.perStore >= r.cityAvgPerStore ? "평균 이상 확인 (경쟁 여유)" : "평균 이하 (경쟁 과밀)"}` +
        " · 면적 미보유로 수요 대비 공급 기준",
    },
    {
      claim: `예상 보증금 ${fmt(r.deposit)}만원 ${r.deposit <= conditions.budget ? "≤" : ">"} 예산 ${fmt(conditions.budget)}만원`,
      tool: "Budget Validator",
      real:
        r.deposit <= conditions.budget
          ? "예산 이내 확인"
          : `${fmt(r.deposit - conditions.budget)}만원 초과`,
    },
    {
      claim: `배후 상주인구 ${d.resident} · 직장인구 ${d.worker} · 폐업추세 지수 ${d.closureTrend}`,
      tool: "Data Lookup Tool",
      real: "원본 데이터프레임 값과 일치",
    },
  ];

  const summary = {
    claim: `최종 응답 내 수치 ${numericClaimCount}개 · Assertion Validator`,
    tool: "→ 허용오차 이내 · 검증불가 주장 0건 · 기준시점 혼용 0건",
  };

  return { corrected, passed, summary };
}

/* 데이터 기준시점 (PRD §13 — Feature별 기준시점 추적).
 * 실제로는 district_features.source_dates JSONB에서 읽어온다. */
export const SOURCE_DATES = [
  { label: "유동인구 · 길단위인구-상권 (OA-15568)", value: "2024-06" },
  { label: "추정매출-상권 (OA-15572)", value: "2024 2분기" },
  { label: "점포-상권 (OA-15577)", value: "2024" },
  { label: "집객시설-상권 (OA-15580)", value: "2024" },
  { label: "직장·상주인구-상권 (OA-15569 / OA-15584)", value: "2024 상반기" },
];
