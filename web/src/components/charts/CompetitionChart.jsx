/* 경쟁강도 — 점포 1개가 나눠 갖는 배후수요, 이 상권 vs 서울 골목 평균.
 *
 * 면적 데이터가 없어 "점포수/면적" 밀도를 만들 수 없으므로 수요 대비 공급으로 본다.
 * 막대가 길수록(값이 클수록) 점포당 수요가 커서 경쟁이 여유롭다는 뜻이다.
 * 실데이터에서는 store_count 와 유동/상주/직장 인구로 같은 식을 계산한다.
 */
export default function CompetitionChart({ r }) {
  const mine = Math.round(r.perStore * 10) / 10;
  const avg = Math.round(r.cityAvgPerStore * 10) / 10;
  const max = Math.max(mine, avg) * 1.35 || 1;

  const W = 232, H = 96, pl = 6, pr = 44;
  const barWidth = W - pl - pr;

  const row = (y, val, label, fill, ink) => {
    const w = Math.max(3, (barWidth * val) / max);
    return (
      <g key={label}>
        <text x={pl} y={y - 4} fontSize="8.5">
          {label}
        </text>
        <rect x={pl} y={y} width={w.toFixed(1)} height="16" rx="3" fill={fill} />
        <text x={pl + w + 5} y={y + 12} fontSize="9" fontWeight="600" fill={ink}>
          {val}
        </text>
      </g>
    );
  };

  return (
    <svg viewBox={`0 0 ${W} ${H}`}>
      {row(20, mine, `이 상권 (점포 ${r.stores}개)`, "var(--brand)", "var(--brand-deep)")}
      {row(64, avg, "서울 골목 평균", "var(--muted)", "var(--muted)")}
    </svg>
  );
}
