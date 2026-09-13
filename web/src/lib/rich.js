/* 근거 문장 표현 방식.
 *
 * 원본 프로토타입은 근거 문장을 "<b>...</b>가 섞인 HTML 문자열"로 만들고
 * innerHTML로 꽂았다. React에서는 dangerouslySetInnerHTML을 쓰지 않기 위해
 * 문장을 조각 배열로 표현한다.
 *
 *   ["동종업종 밀도 ", b("2.1개/100㎡"), ", 서울 평균보다 12% 낮음"]
 *
 * 문자열 조각은 그대로, b(...) 조각은 <b>로 렌더된다 (<Rich/>).
 * 랭킹 행의 pill처럼 굵기 없이 평문만 필요할 때는 plain()을 쓴다.
 */

export const b = (text) => ({ bold: text });

export const plain = (parts) =>
  parts.map((p) => (typeof p === "string" ? p : p.bold)).join("");

/** 문장 안에 들어 있는 숫자 개수 — 검증 로그의 "수치 N개" 집계용 */
export const countDigits = (sentences) =>
  sentences.reduce((n, parts) => n + (plain(parts).match(/\d/g) || []).length, 0);
