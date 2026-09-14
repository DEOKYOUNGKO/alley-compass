import { fmt } from "../../lib/format";

/* 분기별 추정매출 추세 (6개 분기).
 * 실데이터에서는 district_features.estimated_sales 의 분기 시계열이 들어온다. */
export default function SalesChart({ district }) {
  const base = district.salesBase;
  const slope = (district.salesTrend / 100) * base / 5;
  const v = [0, 1, 2, 3, 4, 5].map((q) =>
    Math.round((base - slope * (5 - q) + (((q * 37) % 5) - 2) * base * 0.012) / 10) * 10
  );
  const max = Math.max(...v) * 1.08;
  const min = Math.min(...v) * 0.9;

  const W = 232, H = 118, pl = 6, pr = 10, pt = 14, pb = 18;
  const iw = W - pl - pr, ih = H - pt - pb;
  const X = (i) => pl + (iw * i) / 5;
  const Y = (n) => pt + ih * (1 - (n - min) / (max - min));

  const line = v.map((n, i) => `${i ? "L" : "M"}${X(i).toFixed(1)},${Y(n).toFixed(1)}`).join(" ");

  return (
    <svg viewBox={`0 0 ${W} ${H}`}>
      <line x1={pl} y1={pt + ih} x2={W - pr} y2={pt + ih} stroke="var(--line)" />
      <path d={line} fill="none" stroke="var(--brand)" strokeWidth="2" strokeLinejoin="round" />
      <circle
        cx={X(5).toFixed(1)}
        cy={Y(v[5]).toFixed(1)}
        r="3"
        fill="var(--brand)"
        stroke="var(--surface-2)"
        strokeWidth="1.5"
      />
      <text
        x={(W - pr).toFixed(1)}
        y={Y(v[5]) - 6}
        fontSize="8.5"
        fontWeight="500"
        fill="var(--ink-2)"
        textAnchor="end"
      >
        {fmt(v[5])}만원/월
      </text>
      <text x={pl} y={H - 4} fontSize="8">
        &apos;23 1Q
      </text>
      <text x={W - pr} y={H - 4} fontSize="8" textAnchor="end">
        &apos;24 2Q
      </text>
    </svg>
  );
}
