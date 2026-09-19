import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

/* ──────────────────────────────────────────────────────────────
 * DataRow — "라벨 · 값 · 서울 내 위치" 세 칸짜리 한 줄.
 *
 * 이 서비스에서 가장 많이 반복되는 형태다. 절대값만 보여주면 "그래서
 * 높은 건가?"에 답이 안 되므로, 분포 안에서의 위치를 항상 옆에 세운다.
 * 세 칸의 위치가 카드마다 흔들리면 눈이 매번 다시 찾아야 하므로
 * 이 컴포넌트로 고정한다.
 * ────────────────────────────────────────────────────────────── */

export interface DataRowProps {
  label: ReactNode;
  value: ReactNode;
  /** "상위 12%" 처럼 분포 내 위치. 없으면 칸을 비워 정렬만 유지한다. */
  rank?: ReactNode;
  /** 값이 데이터로 검증되지 않았음을 표시 (예: 외부 추정 보증금) */
  unverified?: boolean;
  className?: string;
}

export function DataRow({ label, value, rank, unverified = false, className }: DataRowProps) {
  return (
    <div
      className={cn(
        "grid grid-cols-[1fr_auto] items-baseline gap-x-3 gap-y-0.5 py-1.5",
        "border-b border-border-subtle last:border-b-0",
        "sm:grid-cols-[minmax(0,1fr)_auto_4.5rem]",
        className,
      )}
    >
      <span className="text-xs text-fg-muted">{label}</span>

      <span className="justify-self-end font-mono text-xs tabular-nums text-fg">
        {value}
        {unverified ? (
          <em className="ml-1.5 not-italic font-sans text-2xs text-caution-text">미검증</em>
        ) : null}
      </span>

      <span className="col-span-2 justify-self-end text-2xs text-fg-subtle sm:col-span-1">
        {rank}
      </span>
    </div>
  );
}
