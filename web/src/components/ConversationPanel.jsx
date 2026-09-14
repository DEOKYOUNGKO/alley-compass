import { useEffect, useRef } from "react";
import Rich from "./Rich";

/* 대화형 재탐색 (F-12).
 * 지금은 미리 정해둔 칩만 처리한다. 자연어 입력을 받으려면 이 자리에
 * 입력창 + 조건 파싱 에이전트를 붙이면 되고, 아래 로그 형식은 그대로 쓴다. */

const CHIPS = [
  { act: "laundry", label: "카페 말고 세탁소는?" },
  { act: "budget3000", label: "예산을 3,000만원으로" },
  { act: "age20", label: "20대 유동인구만" },
  { act: "resident", label: "조용한 주거 배후로" },
  { act: "reset", label: "처음으로 되돌리기", className: "chip reset" },
];

export default function ConversationPanel({ messages, onChip }) {
  const logRef = useRef(null);

  useEffect(() => {
    const el = logRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

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
        {CHIPS.map((c) => (
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
