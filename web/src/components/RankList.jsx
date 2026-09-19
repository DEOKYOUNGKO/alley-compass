import { scoreClass } from "../lib/format";

const AXIS_LABEL = {
  demand: "수요",
  competition: "경쟁 여유",
  performance: "매출 추세",
  access: "접근성",
  stability: "폐업 안정성",
};

/* 행의 pill 2~3개는 backend score_breakdown(0~100, 서울 골목상권 내 백분위)
 * 중 가장 높은 2개(pro)와 가장 낮은 1개(50 미만일 때만, con)다. 문장이 아니라
 * 실제 계산값이므로 지어낼 근거가 없다 — 전체 문장은 Drawer의 "추천·반대 근거
 * 생성하기" 버튼으로 Claude가 만든다. */
function pillsFor(breakdown) {
  const entries = Object.entries(breakdown || {}).filter(([, v]) => v !== null && v !== undefined);
  if (entries.length === 0) return [];
  const sorted = [...entries].sort((a, b) => b[1] - a[1]);
  const pros = sorted.slice(0, 2).map(([k, v]) => ({ cls: "pro", text: `${AXIS_LABEL[k] || k} ${Math.round(v)}` }));
  const worst = sorted[sorted.length - 1];
  const cons = worst && worst[1] < 50 ? [{ cls: "con", text: `${AXIS_LABEL[worst[0]] || worst[0]} ${Math.round(worst[1])}` }] : [];
  return [...pros, ...cons];
}

export default function RankList({ ranking, selectedCode, onSelect }) {
  return (
    <ol className="ranklist">
      {ranking.map((r) => (
        <li key={r.district_code}>
          <button
            type="button"
            className="rankrow"
            aria-expanded={selectedCode === r.district_code}
            onClick={() => onSelect(r.district_code)}
          >
            <span className="rn">{r.rank}</span>
            <span className="body">
              <span className="name">{r.district_name}</span>
              <span className="loc mono">상권_코드 {r.district_code}</span>
              <span className="reasons">
                {pillsFor(r.score_breakdown).map((p, k) => (
                  <span className={`pill ${p.cls}`} key={k}>
                    {p.text}
                  </span>
                ))}
              </span>
            </span>
            <span className={`score ${scoreClass(r.final_score)}`}>
              <span className="pct">{r.final_score}점</span>
              <span className="cap">생존 안정성</span>
              <span className="meter">
                <i style={{ width: `${r.final_score}%` }} />
              </span>
            </span>
          </button>
        </li>
      ))}
    </ol>
  );
}
