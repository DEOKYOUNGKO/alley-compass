import { fmt } from "@/lib/format";
import type { CompetitionChartOut } from "@/types/api";

import { SeriesUnavailable } from "./SeriesChart";

/* 경쟁강도 — 점포 1개가 나눠 갖는 배후수요. 이 상권 vs 서울 골목 평균.
 *
 * 면적 데이터가 없어 "점포수/면적" 밀도를 만들 수 없으므로 수요 대비 공급으로 본다.
 * 막대가 길수록(값이 클수록) 점포당 수요가 커서 경쟁이 여유롭다는 뜻이다.
 * 계산은 backend/detail.py 가 하고 여기서는 그리기만 한다. */
export function CompetitionChart({ data }: { data: CompetitionChartOut | null }) {
  if (!data) {
    return (
      <SeriesUnavailable reason="배후수요(유동·상주·직장) 또는 점포수 데이터가 없어 경쟁강도를 계산하지 못했습니다." />
    );
  }

  const max = Math.max(data.district_value, data.city_avg) * 1.32 || 1;
  const roomy = data.district_value >= data.city_avg;

  const W = 260;
  const H = 104;
  const PL = 10;
  const PR = 52;
  const barWidth = W - PL - PR;

  const rows = [
    {
      y: 22,
      value: data.district_value,
      label: `이 상권 (점포 ${fmt(data.store_count)}개)`,
      primary: true,
    },
    { y: 66, value: data.city_avg, label: `서울 골목 평균 (${data.n_districts}곳)`, primary: false },
  ];

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label={`점포당 배후수요. 이 상권 ${fmt(data.district_value)}, 서울 평균 ${fmt(data.city_avg)}. 평균보다 ${roomy ? "여유롭다" : "과밀하다"}.`}
      className="w-full"
    >
      {rows.map((row) => {
        const w = Math.max(3, (barWidth * row.value) / max);
        const barTone = roomy ? "fill-positive" : "fill-negative";
        const textTone = roomy ? "fill-positive-text" : "fill-negative-text";

        return (
          <g key={row.label}>
            <text x={PL} y={row.y - 5} fontSize="8.5" className="fill-fg-muted">
              {row.label}
            </text>
            <rect
              x={PL}
              y={row.y}
              width={w}
              height="16"
              rx="2"
              className={row.primary ? barTone : "fill-nodata"}
            />
            <text
              x={PL + w + 5}
              y={row.y + 12}
              fontSize="9"
              fontWeight="600"
              className={row.primary ? textTone : "fill-fg-muted"}
            >
              {fmt(row.value)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
