/* 지도 대신 Top 5 스트립 (F-10).
 *
 * ⚠️ 서울 5종 데이터셋(길단위인구·점포·추정매출·집객시설·직장/상주인구)에는
 * 상권의 위경도가 없다. 목업 프로토타입 시절엔 화면용 가짜 좌표(mx/my)를
 * 썼지만, 실제 데이터로 바뀐 지금은 그 좌표가 없어 지도를 그릴 수 없다.
 * 없는 걸 있는 것처럼 그리지 않고, 실제 순위·점수만 보여주는 스트립으로
 * 대신한다. districts.latitude/longitude가 채워지면(별도 영역-상권 데이터나
 * geocoding 필요) 이 파일만 실제 지도로 바꾸면 된다.
 */

const shortName = (name) => name.replace(/\(.*\)/, "").split(" ")[0];

export default function MapCard({ ranking, selectedCode, onSelect }) {
  return (
    <div className="mapcard">
      <div className="topstrip">
        {ranking.map((r) => (
          <button
            type="button"
            key={r.district_code}
            className={`topcard${selectedCode === r.district_code ? " sel" : ""}`}
            onClick={() => onSelect(r.district_code)}
          >
            <span className="tn">{r.rank}</span>
            <span className="tname">{shortName(r.district_name)}</span>
            <span className="tscore">{r.final_score}점</span>
          </button>
        ))}
      </div>
      <div className="maplegend">
        <span>지도는 준비 중 — 서울시 5종 데이터셋에 상권 위경도가 없습니다 (알려진 한계, docs/PRD.md 참고)</span>
      </div>
    </div>
  );
}
