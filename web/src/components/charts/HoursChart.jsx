import { SHAPES } from "../../data/mockDistricts";
import { clamp, fmt } from "../../lib/format";

/* 시간대별 유동인구 (2시간 단위 12구간).
 * 실데이터에서는 district_features.extra_features 의 foot_00_06 … foot_21_24 가 들어온다. */
export default function HoursChart({ district }) {
  const shape = SHAPES[district.hours];
  const peak = Math.round(300 + district.foot20 * 12);
  const v = shape.map((s) => Math.round(peak * s));
  const max = Math.max(...v);

  const W = 232, H = 118, pl = 6, pr = 8, pt = 14, pb = 18;
  const iw = W - pl - pr, ih = H - pt - pb;
  const X = (i) => pl + (iw * i) / (v.length - 1);
  const Y = (n) => pt + ih * (1 - n / max);

  const line = v.map((n, i) => `${i ? "L" : "M"}${X(i).toFixed(1)},${Y(n).toFixed(1)}`).join(" ");
  const area = `${line} L${X(v.length - 1).toFixed(1)},${pt + ih} L${pl},${pt + ih} Z`;
  const peakIndex = v.indexOf(max);
  const labelX = clamp(X(peakIndex), 34, W - 64);

  return (
    <svg viewBox={`0 0 ${W} ${H}`}>
      <line x1={pl} y1={pt} x2={W - pr} y2={pt} stroke="var(--line)" strokeDasharray="2 3" />
      <line x1={pl} y1={pt + ih} x2={W - pr} y2={pt + ih} stroke="var(--line)" />
      <path d={area} fill="var(--brand)" fillOpacity="0.14" />
      <path d={line} fill="none" stroke="var(--brand)" strokeWidth="2" strokeLinejoin="round" />
      <circle
        cx={X(peakIndex).toFixed(1)}
        cy={Y(max).toFixed(1)}
        r="3"
        fill="var(--brand)"
        stroke="var(--surface-2)"
        strokeWidth="1.5"
      />
      <text
        x={labelX.toFixed(1)}
        y={Y(max) - 6}
        fontSize="8.5"
        fontWeight="500"
        fill="var(--ink-2)"
        textAnchor="middle"
      >
        {peakIndex * 2}시 · {fmt(max)}명/시
      </text>
      {[0, 3, 6, 9].map((i) => (
        <text key={i} x={X(i).toFixed(1)} y={H - 4} fontSize="8" textAnchor="middle">
          {i * 2}시
        </text>
      ))}
    </svg>
  );
}
