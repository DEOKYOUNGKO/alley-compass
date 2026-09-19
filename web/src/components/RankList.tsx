import { AlertCircle } from "lucide-react";

import { AXIS_LABEL } from "@/data/businessTypes";
import { scoreTone } from "@/lib/format";
import type { DistrictScore } from "@/types/api";
import { Badge, Card, Meter } from "@/components/ui";

/* ──────────────────────────────────────────────────────────────
 * 상권 Ranking 목록 (F-06). backend POST /rank 결과를 그대로 그린다.
 *
 * 행에 붙는 요약은 근거 문장이 아니라 score_breakdown 중 가장 높은/낮은 축이다.
 * 근거 문장은 Claude 호출(과금)이라 목록에서 미리 만들 수 없다 — 상세를 열고
 * 사용자가 버튼을 눌러야 생성된다.
 *
 * 행 전체가 버튼이라 Tab 한 번에 하나씩 넘어가고 Enter 로 열린다.
 * ────────────────────────────────────────────────────────────── */

export interface RankListProps {
  ranking: readonly DistrictScore[];
  selectedCode: string | null;
  onSelect: (code: string) => void;
  loading?: boolean;
}

export function RankList({ ranking, selectedCode, onSelect, loading = false }: RankListProps) {
  if (!loading && ranking.length === 0) {
    return (
      <Card variant="nodata">
        <div className="flex items-start gap-2.5 px-4 py-5">
          <AlertCircle aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-fg-subtle" />
          <div>
            <p className="text-sm font-medium text-fg">후보 상권이 없습니다</p>
            <p className="mt-1 text-xs text-fg-muted">
              조건을 바꾸거나 다른 업종으로 다시 찾아보세요.
            </p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <ol
      className={`flex flex-col gap-2 transition-opacity duration-200 ${loading ? "opacity-50" : ""}`}
      aria-busy={loading}
    >
      {ranking.map((r) => (
        <li key={r.district_code}>
          <RankRow
            r={r}
            selected={selectedCode === r.district_code}
            onSelect={() => onSelect(r.district_code)}
          />
        </li>
      ))}
    </ol>
  );
}

type AxisKey = keyof typeof AXIS_LABEL;

/** 점수를 가장 많이 끌어올린 축과 가장 많이 끌어내린 축. 데이터 없는 축은 뺀다. */
function extremes(breakdown: DistrictScore["score_breakdown"]) {
  const entries = (Object.entries(breakdown) as [AxisKey, number | null][]).filter(
    (entry): entry is [AxisKey, number] => entry[1] !== null,
  );
  if (entries.length === 0) return { best: null, worst: null };

  const sorted = [...entries].sort((a, b) => b[1] - a[1]);
  const best = sorted[0] ?? null;
  const worst = sorted.length > 1 ? (sorted[sorted.length - 1] ?? null) : null;
  return { best, worst };
}

function RankRow({
  r,
  selected,
  onSelect,
}: {
  r: DistrictScore;
  selected: boolean;
  onSelect: () => void;
}) {
  const score = Math.round(r.final_score);
  const tone = scoreTone(score);
  const { best, worst } = extremes(r.score_breakdown);

  return (
    <Card
      as="button"
      interactive
      selected={selected}
      type="button"
      onClick={onSelect}
      aria-label={`${r.rank}위 ${r.district_name}, 생존 안정성 ${score}점. 상세 지표 열기`}
      className="group px-3.5 py-3"
    >
      <div className="flex items-start gap-3">
        <span
          aria-hidden="true"
          className="mt-0.5 w-6 shrink-0 text-center font-mono text-lg font-semibold tabular-nums text-fg-subtle group-hover:text-accent"
        >
          {r.rank}
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <span className="text-md font-semibold text-fg">{r.district_name}</span>

          </div>

          <div className="mt-2 flex flex-wrap gap-1.5">
            {best ? (
              <Badge tone="positive">
                {AXIS_LABEL[best[0]]} 상위 {Math.max(1, Math.round(100 - best[1]))}%
              </Badge>
            ) : null}
            {worst ? (
              <Badge tone="negative">
                {AXIS_LABEL[worst[0]]} 하위 {Math.max(1, Math.round(worst[1]))}%
              </Badge>
            ) : null}
            {!best && !worst ? <Badge tone="nodata">구성 지표 데이터 부족</Badge> : null}
          </div>
        </div>

        <div className="w-24 shrink-0 text-right">
          <p className="font-mono text-2xl font-semibold leading-none tabular-nums text-fg">
            {score}
            <span className="ml-0.5 text-xs font-normal text-fg-subtle">점</span>
          </p>
          <p className="mt-1 text-2xs text-fg-subtle">생존 안정성</p>
          <Meter
            value={score}
            tone={tone}
            size="sm"
            label={`생존 안정성 ${score}점`}
            className="mt-1.5"
          />
        </div>
      </div>
    </Card>
  );
}
