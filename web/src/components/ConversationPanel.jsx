import { useEffect, useRef } from "react";
import Rich from "./Rich";

/* 대화형 재탐색 (F-12).
 * 지금은 미리 정해둔 칩만 처리한다. 자연어 입력을 받으려면 이 자리에
 * 입력창 + 조건 파싱 에이전트를 붙이면 되고, 아래 로그 형식은 그대로 쓴다. */

const FIXED_CHIPS = [
  { act: "budget3000", label: "예산을 3,000만원으로" },
  { act: "age20", label: "20대 유동인구만" },
  { act: "resident", label: "조용한 주거 배후로" },
  { act: "reset", label: "처음으로 되돌리기", className: "chip reset" },
];

export default function ConversationPanel({ messages, onChip, altBusinessLabel }) {
  const logRef = useRef(null);

  useEffect(() => {
    const el = logRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  // 업종 전환 칩은 실제로 수집된 업종이 2개 이상일 때만 보인다 — 없는 업종을
  // 부르면 백엔드가 404를 내기 때문에, 아예 지어내지 않는다.
  const chips = altBusinessLabel
    ? [{ act: "switchBiz", label: `말고 ${altBusinessLabel}는?` }, ...FIXED_CHIPS]
    : FIXED_CHIPS;

  return (
    <section className="panel">
      <h2>대화형 재탐색</h2>
      <div className="log" ref={logRef}>
        {messages.map((m) => (
          <div className={`msg ${m.from}`} key={m.id}>
            <span className="from">{m.from === "user" ? "A씨" : "골목 컴퍼스"}</span>
            <Rich parts={m.parts} />
          </div>
        ))}
      </div>
      <div className="chips">
        {chips.map((c) => (
          <button
            key={c.act}
            type="button"
            className={c.className || "chip"}
            onClick={() => onChip(c.act)}
          >
            {c.label}
          </button>
        ))}
      </div>
    </section>
  );
}
