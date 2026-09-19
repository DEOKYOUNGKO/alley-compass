/* ──────────────────────────────────────────────────────────────
 * 근거 문장의 표현 방식.
 *
 * 문장을 HTML 문자열로 만들어 innerHTML 로 꽂지 않는다. 조각 배열로 둔다.
 *
 *   ["점포당 배후수요 ", b("2.9"), ", 서울 평균보다 15% 높음"]
 *
 * 이유 ① dangerouslySetInnerHTML 을 쓰지 않아도 된다.
 * 이유 ② 같은 문장을 태그 없이 평문으로도 써야 한다(목록의 pill).
 *        plain() 하나로 해결된다.
 * 이유 ③ Agent(Claude)가 만든 문장을 받을 때도 이 형태로 변환하면
 *        화면 코드를 그대로 둘 수 있다.
 * ────────────────────────────────────────────────────────────── */

export interface BoldPart {
  bold: string;
}

export type RichPart = string | BoldPart;
export type RichParts = RichPart[];

export const b = (text: string): BoldPart => ({ bold: text });

export const plain = (parts: RichParts): string =>
  parts.map((p) => (typeof p === "string" ? p : p.bold)).join("");

/** 문장들에 들어 있는 숫자 개수 — 검증 로그의 "수치 N개" 집계용 */
export const countDigits = (sentences: RichParts[]): number =>
  sentences.reduce((n, parts) => n + (plain(parts).match(/\d/g)?.length ?? 0), 0);
