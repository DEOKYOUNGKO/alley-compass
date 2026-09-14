import { scoreClass } from "../lib/format";
import { topLabel } from "../lib/stats";

/* 상권 진단 카드 4종.
 * 각 카드는 "지수(0~100) + 서울 골목상권 내 상위%"를 보여준다. 절대 점수보다
 * 분포 안에서의 위치가 의사결정에 쓸모 있기 때문이다(Percentile Tool과 같은 정의).
 * 데이터를 보유하지 않은 영역은 점수를 만들지 않고 이유를 적는다. */
export default function DiagnosticPanel({ areas }) {
  return (
    <div className="diag">
      {areas.map((a) => (
        <div className={`dcard${a.available ? "" : " na"}`} key={a.key}>
          <div className="dhead">
            <h5>{a.label}</h5>
            {a.available ? (
              <span className="dtop">{topLabel(a.topPct)}</span>
            ) : (
              <span className="dtop na">데이터 미보유</span>
            )}
          </div>
          <div className="dcap">{a.caption}</div>

          {a.available && (
            <>
              <div className={`dscore ${scoreClass(a.score)}`}>
                <span className="pct">{a.score}</span>
                <span className="cap">지수</span>
                <span className="meter">
                  <i style={{ width: `${a.score}%` }} />
                </span>
              </div>
            </>
          )}

          <ul className="drows">
            {a.rows.map((row) => (
              <li key={row.label}>
                <span className="rl">{row.label}</span>
                <span className="rv">
                  {row.value}
                  {row.unverified && <em className="unver">미검증</em>}
                </span>
                <span className="rt">{row.top === undefined ? "" : topLabel(row.top)}</span>
              </li>
            ))}
          </ul>

          {a.note && <div className="dnote">{a.note}</div>}
        </div>
      ))}
    </div>
  );
}
