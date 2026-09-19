import { useEffect, useRef } from "react";

import type { RichParts } from "@/lib/rich";
import { Button, Card, CardBody, CardHeader, CardTitle } from "@/components/ui";

import { Rich } from "./Rich";

/* ──────────────────────────────────────────────────────────────
 * 대화형 재탐색 (F-12).
 *
 * 미리 정해둔 질문 칩만 처리한다. 자연어 입력을 받으려면 이 자리에 입력창 +
 * 조건 파싱 에이전트를 붙이면 되고, 아래 로그 형식은 그대로 쓴다.
 *
 * 칩은 고정 목록이 아니다 — "다른 업종은?" 칩은 실제로 수집된 업종이 2개
 * 이상일 때만 만든다. 하나뿐인데 칩을 보여주면 없는 업종을 부르다 404가 난다.
 * 지어낸 선택지를 보여주지 않는다는 원칙이 UI 쪽에도 그대로 적용된다.
 *
 * 로그는 aria-live 로 읽어준다. 조건을 바꾸면 화면 다른 쪽(순위)이 통째로
 * 바뀌는데, 스크린리더 사용자는 그 변화를 알 방법이 없기 때문이다.
 * ────────────────────────────────────────────────────────────── */

export type QuickAskAction = "otherBiz" | "budget3000" | "age20" | "resident";

export interface Message {
  id: number;
  from: "user" | "bot";
  parts: RichParts;
}

export interface AskPanelProps {
  messages: readonly Message[];
  onAsk: (action: QuickAskAction) => void;
  /** 수집된 업종 수. 2개 이상일 때만 업종 전환 칩을 만든다. */
  businessTypeCount: number;
  busy?: boolean;
}

export function AskPanel({ messages, onAsk, businessTypeCount, busy = false }: AskPanelProps) {
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = logRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  const chips: Array<{ action: QuickAskAction; label: string }> = [
    ...(businessTypeCount > 1
      ? ([{ action: "otherBiz", label: "다른 업종으로 보면?" }] as const)
      : []),
    { action: "budget3000", label: "예산을 3,000만원으로" },
    { action: "age20", label: "20대 유동인구만" },
    { action: "resident", label: "조용한 주거 배후로" },
  ];

  return (
    <Card>
      <CardHeader divided>
        <CardTitle as="h3" className="text-sm">
          대화형 재탐색
        </CardTitle>
      </CardHeader>

      <CardBody className="pt-3">
        <div
          ref={logRef}
          role="log"
          aria-live="polite"
          aria-label="분석 대화 기록"
          className="scroll-slim flex max-h-72 flex-col gap-2.5 overflow-y-auto pr-1"
        >
          {messages.length === 0 ? (
            <p className="text-xs text-fg-subtle">조건을 바꾸면 여기에 재분석 내역이 쌓입니다.</p>
          ) : null}

          {messages.map((m) => (
            <div
              key={m.id}
              className={
                m.from === "user"
                  ? "max-w-[85%] self-end rounded-xl rounded-br-sm bg-accent-subtle px-3 py-2"
                  : "max-w-[92%] rounded-xl rounded-bl-sm bg-surface-sunken px-3 py-2"
              }
            >
              <p className="mb-0.5 font-mono text-2xs uppercase tracking-wider text-fg-subtle">
                {m.from === "user" ? "나" : "골목 컴퍼스"}
              </p>
              <p className="text-xs leading-relaxed text-fg-body">
                <Rich parts={m.parts} />
              </p>
            </div>
          ))}
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5 border-t border-border-subtle pt-3">
          {chips.map((chip) => (
            <Button
              key={chip.action}
              variant="outline"
              size="sm"
              disabled={busy}
              onClick={() => onAsk(chip.action)}
            >
              {chip.label}
            </Button>
          ))}
        </div>
      </CardBody>
    </Card>
  );
}
