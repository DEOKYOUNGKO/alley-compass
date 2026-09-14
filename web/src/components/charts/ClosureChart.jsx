/* 연도별 동종업종 폐업 점포수 (4년).
 * 마지막 막대만 색으로 신호를 준다 — 증가세면 risk, 아니면 good.
 * 실데이터에서는 district_features.extra_features.close_store_count 시계열이 들어온다. */
export default function ClosureChart({ district }) {
  const rising = district.closureTrend >= 22;
  const step = rising ? 1.6 : 0.3;
  const start = 2 + Math.round(district.closureTrend * 0.06);
  const v = [0, 1, 2, 3].map((i) => Math.round(start + i * step));
  const max = Math.max(...v) * 1.25 || 1;

  const W = 232, H = 118, pl = 8, pr = 8, pt = 14, pb = 18, gap = 10;
  const iw = W - pl - pr, ih = H - pt - pb;
  const bw = (iw - gap * 3) / 4;

  return (
    <svg viewBox={`0 0 ${W} ${H}`}>
      <line x1={pl} y1={pt + ih} x2={W - pr} y2={pt + ih} stroke="var(--line)" />
      {v.map((n, i) => {
        const x = pl + i * (bw + gap);
        const h = Math.max(2, (ih * n) / max);
        const y = pt + ih - h;
        const fill = i === 3 ? (rising ? "var(--risk)" : "var(--good)") : "var(--muted)";
        return (
          <g key={i}>
            <rect x={x.toFixed(1)} y={y.toFixed(1)} width={bw.toFixed(1)} height={h.toFixed(1)} rx="2.5" fill={fill} />
            <text x={(x + bw / 2).toFixed(1)} y={(y - 4).toFixed(1)} fontSize="8" textAnchor="middle" fill="var(--ink-2)">
              {n}
            </text>
            <text x={(x + bw / 2).toFixed(1)} y={H - 4} fontSize="8" textAnchor="middle">
              &apos;2{i + 1}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
