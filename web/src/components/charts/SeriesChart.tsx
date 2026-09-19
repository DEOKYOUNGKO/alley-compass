import { fmt } from "@/lib/format";
import type { Series } from "@/types/api";

/* ──────────────────────────────────────────────────────────────
 * 백엔드가 내려준 시계열을 그린다. 축·라벨·값 전부 응답에서 온다 —
 * 프론트가 수치를 만들어내지 않는다.
 *
 * available=false 면 그래프를 그리지 않고 백엔드가 준 이유를 그대로 보여준다.
 * 분기가 1개뿐인데 점 하나를 선으로 이어 "추세"처럼 보이게 하지 않기 위해서다.
 * ────────────────────────────────────────────────────────────── */

const W = 260;
const H = 120;
const PL = 10;
const PR = 10;
const PT = 16;
const PB = 20;

export type SeriesTone = "accent" | "positive" | "negative";

const STROKE: Record<SeriesTone, string> = {
  accent: "stroke-accent",
  positive: "stroke-positive",
  negative: "stroke-negative",
};
const FILL: Record<SeriesTone, string> = {
  accent: "fill-accent",
  positive: "fill-positive",
  negative: "fill-negative",
};

export function SeriesUnavailable({ reason }: { reason: string | null }) {
  return (
    <div className="flex min-h-[7rem] items-center rounded-lg border border-dashed border-nodata-border bg-nodata-subtle px-3 py-4">
      <p className="text-2xs leading-relaxed text-fg-muted">
        {reason ?? "표시할 데이터가 없습니다."}
      </p>
    </div>
  );
}

export interface SeriesChartProps {
  series: Series;
  /** 값에 붙는 단위 — "명", "만원", "%" */
  unit?: string;
  tone?: SeriesTone;
  /** 스크린리더가 읽을 그래프 설명 */
  label: string;
}

/** 꺾은선 — 분기별 매출처럼 "흐름"을 보는 계열 */
export function LineSeriesChart({ series, unit = "", tone = "accent", label }: SeriesChartProps) {
  if (!series.available || series.points.length < 2) {
    return <SeriesUnavailable reason={series.reason} />;
  }

  const values = series.points.map((p) => p.value);
  const max = Math.max(...values);
  const min = Math.min(...values);
  const span = max - min || Math.abs(max) || 1;
  const top = max + span * 0.12;
  const bottom = min - span * 0.12;

  const iw = W - PL - PR;
  const ih = H - PT - PB;
  const X = (i: number) => PL + (iw * i) / (series.points.length - 1);
  const Y = (n: number) => PT + ih * (1 - (n - bottom) / (top - bottom));

  const path = series.points
    .map((p, i) => `${i ? "L" : "M"}${X(i).toFixed(1)},${Y(p.value).toFixed(1)}`)
    .join(" ");

  const lastIndex = series.points.length - 1;
  const last = series.points[lastIndex];
  const first = series.points[0];
  if (!last || !first) return <SeriesUnavailable reason={series.reason} />;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label={`${label}. ${series.points.map((p) => `${p.label} ${fmt(p.value)}${unit}`).join(", ")}`}
      className="w-full"
    >
      <line x1={PL} y1={PT + ih} x2={W - PR} y2={PT + ih} className="stroke-border" />

      <path d={path} fill="none" className={STROKE[tone]} strokeWidth="1.8" strokeLinejoin="round" />
      <circle
        cx={X(lastIndex)}
        cy={Y(last.value)}
        r="2.8"
        className={`${FILL[tone]} stroke-surface`}
        strokeWidth="1.4"
      />
      <text
        x={W - PR}
        y={Y(last.value) - 6}
        fontSize="8.5"
        textAnchor="end"
        className="fill-fg font-medium"
      >
        {fmt(last.value)}
        {unit}
      </text>

      <text x={PL} y={H - 5} fontSize="7.5" className="fill-fg-subtle">
        {first.label}
      </text>
      <text x={W - PR} y={H - 5} fontSize="7.5" textAnchor="end" className="fill-fg-subtle">
        {last.label}
      </text>
    </svg>
  );
}

/** 막대 — 시간대별 유동인구처럼 "구간별 크기"를 비교하는 계열 */
export function BarSeriesChart({ series, unit = "", tone = "accent", label }: SeriesChartProps) {
  if (!series.available || series.points.length === 0) {
    return <SeriesUnavailable reason={series.reason} />;
  }

  const values = series.points.map((p) => p.value);
  const max = Math.max(...values) * 1.2 || 1;
  const peak = Math.max(...values);

  const iw = W - PL - PR;
  const ih = H - PT - PB;
  const gap = 6;
  const bw = (iw - gap * (series.points.length - 1)) / series.points.length;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label={`${label}. ${series.points.map((p) => `${p.label} ${fmt(p.value)}${unit}`).join(", ")}`}
      className="w-full"
    >
      <line x1={PL} y1={PT + ih} x2={W - PR} y2={PT + ih} className="stroke-border" />

      {series.points.map((p, i) => {
        const x = PL + i * (bw + gap);
        const h = Math.max(2, (ih * p.value) / max);
        const y = PT + ih - h;
        const isPeak = p.value === peak;

        return (
          <g key={p.label}>
            <rect
              x={x}
              y={y}
              width={bw}
              height={h}
              rx="2"
              className={isPeak ? FILL[tone] : "fill-nodata"}
            />
            {isPeak ? (
              <text
                x={x + bw / 2}
                y={y - 4}
                fontSize="8"
                textAnchor="middle"
                className="fill-fg font-medium"
              >
                {fmt(p.value)}
                {unit}
              </text>
            ) : null}
            <text
              x={x + bw / 2}
              y={H - 5}
              fontSize="7"
              textAnchor="middle"
              className="fill-fg-subtle"
            >
              {p.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
