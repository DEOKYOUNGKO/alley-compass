import { reasons } from "../lib/reasons";
import { scoreClass } from "../lib/format";
import { plain } from "../lib/rich";

/* 상권 Ranking 목록 (F-06).
 * 행의 pill은 근거 문장의 평문 요약이고, 전체 문장은 Drawer에서 본다. */
export default function RankList({ ranking, conditions, selectedCode, onSelect }) {
  return (
    <ol className="ranklist">
      {ranking.map((r, i) => {
        const rs = reasons(r, conditions);
        const pills = [
          ...rs.pros.slice(0, 2).map((p) => ({ cls: "pro", text: plain(p) })),
          ...rs.cons.slice(0, 1).map((p) => ({ cls: "con", text: plain(p) })),
        ];

        return (
          <li key={r.d.code}>
            <button
              type="button"
              className="rankrow"
              aria-expanded={selectedCode === r.d.code}
              onClick={() => onSelect(r.d.code)}
            >
              <span className="rn">{i + 1}</span>
              <span className="body">
                <span className="name">{r.d.name}</span>
                <span className="loc mono">
                  {r.d.gu} · 상권_코드 {r.d.code}
                </span>
                <span className="reasons">
                  {pills.map((p, k) => (
                    <span className={`pill ${p.cls}`} key={k}>
                      {p.text}
                    </span>
                  ))}
                </span>
              </span>
              <span className={`score ${scoreClass(r.surv)}`}>
                <span className="pct">{r.surv}점</span>
                <span className="cap">생존 안정성</span>
                <span className="meter">
                  <i style={{ width: `${r.surv}%` }} />
                </span>
              </span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}
