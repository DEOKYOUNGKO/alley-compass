import { Loader2 } from "lucide-react";

import { fmt } from "@/lib/format";
import type { RankResponse } from "@/types/api";

/* 결과 머리말 — "지금 무엇을, 무슨 기준으로 보고 있는가".
 * 조건을 바꾸면 이 줄이 먼저 바뀌므로 재계산이 일어났다는 신호도 겸한다. */

export interface ResultSummaryProps {
  meta: RankResponse | null;
  loading: boolean;
}

export function ResultSummary({ meta, loading }: ResultSummaryProps) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
      <div className="min-w-0">
        <h2 className="text-xl font-semibold text-fg">
          내 조건에서 살아남을 가능성이 높은 골목상권
        </h2>

        <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-fg-muted">
          {meta ? (
            <>
              <span className="font-medium text-fg-body">{meta.business_name}</span>
              <span aria-hidden="true">·</span>
              <span>
                서울 골목상권{" "}
                <span className="font-mono tabular-nums text-fg">{fmt(meta.n_candidates)}곳</span>{" "}
                비교
              </span>
              <span aria-hidden="true">·</span>
              <span>
                상위 <span className="font-mono tabular-nums text-fg">{meta.results.length}곳</span>{" "}
                표시
              </span>
            </>
          ) : (
            <span>조건에 맞는 상권을 찾는 중…</span>
          )}

          {loading ? (
            <span
              className="inline-flex items-center gap-1 text-accent-text"
              role="status"
              aria-label="다시 찾는 중"
            >
              <Loader2 aria-hidden="true" className="size-3 animate-spin" />
              다시 찾는 중
            </span>
          ) : null}
        </p>
      </div>
    </div>
  );
}
