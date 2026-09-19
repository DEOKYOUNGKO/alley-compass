/* 업종 목록은 더 이상 여기 상수로 두지 않는다 — backend GET /business-types가
 * 실제로 수집된 업종만 돌려주고, App.jsx가 그걸로 조건 패널 드롭다운을 채운다.
 * (alley_compass_etl로 아직 "커피-음료" 1개만 수집돼 있으면 드롭다운도 1개뿐이다
 * — 이건 버그가 아니라 데이터가 그만큼만 있다는 뜻이다.)
 *
 * 이 파일엔 업종에 안 묶인, 화면 문구용 라벨만 남긴다.
 */

export const AGE_LABEL = { "20": "20대", "30": "30대", both: "20–30대" };

export const CHARACTER_LABEL = {
  foot: "유동인구 중심",
  resident: "주거 배후",
  worker: "직장 배후",
  campus: "대학가",
};

export const PREF_LABEL = {
  survival: "생존 안정성",
  cost: "예산 적합성",
  growth: "성장 가능성",
};

/* A씨(1순위 페르소나)의 최초 조건 — PRD §6 사용자 시나리오.
 * biz는 빈 값으로 시작해서, 업종 목록을 받아온 뒤 첫 번째 실제 업종으로 채운다. */
export const INITIAL_CONDITIONS = {
  biz: "",
  budget: 5000,
  age: "both",
  character: "foot",
  priority: "survival",
};
