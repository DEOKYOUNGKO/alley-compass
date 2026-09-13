/* 지도 시각화 (F-10).
 *
 * ⚠️ 서울 외곽선은 실제 지형이 아니라 도식화된 SVG 패스이고, 핀 좌표(mx/my)도
 * 위경도가 아니다. districts 테이블의 latitude/longitude가 채워지면
 * 실제 지도 API(PRD §19)로 교체한다 — 그때 바꿀 파일은 이것 하나다.
 */

const OUTLINE = "M6,14 C22,6 44,4 62,8 C82,12 96,20 95,34 C94,48 82,58 60,58 C40,58 20,54 10,44 C2,36 0,22 6,14 Z";
const RIVER = "M0,30 C18,24 30,36 46,32 S76,24 100,30 L100,40 C80,44 62,34 46,40 S16,46 0,42 Z";

const shortName = (name) => name.replace(/\(.*\)/, "").split(" ")[0];

export default function MapCard({ districts, top5Codes, selectedCode, onSelect }) {
  return (
    <div className="mapcard">
      <svg viewBox="0 0 100 62" role="img" aria-label="서울 골목상권 후보 위치 지도">
        <path d={OUTLINE} fill="var(--surface-2)" stroke="var(--line)" />
        <path d={RIVER} fill="var(--brand-tint)" />
        <text x="4" y="52" fontSize="3.2" fill="var(--muted)" style={{ fontFamily: "'IBM Plex Sans KR',sans-serif" }}>
          한강
        </text>

        {districts.map((d) => {
          const rank = top5Codes.indexOf(d.code);
          const isSelected = selectedCode === d.code;

          if (rank < 0) {
            return (
              <g key={d.code} style={{ cursor: "pointer" }} onClick={() => onSelect(d.code)}>
                <circle cx={d.mx} cy={d.my} r="1.7" fill="var(--surface)" stroke="var(--muted)" strokeWidth="1" />
              </g>
            );
          }

          return (
            <g key={d.code} style={{ cursor: "pointer" }} onClick={() => onSelect(d.code)}>
              <circle
                cx={d.mx}
                cy={d.my}
                r={isSelected ? 4.2 : 3.2}
                fill="var(--brand)"
                stroke={isSelected ? "var(--brand-deep)" : "var(--surface)"}
                strokeWidth={isSelected ? 1.4 : 1}
              />
              <text
                x={d.mx}
                y={d.my + 1.6}
                fontSize="3.4"
                fontWeight="700"
                fill="#fff"
                textAnchor="middle"
                style={{ fontFamily: "'Fraunces',serif" }}
              >
                {rank + 1}
              </text>
              <text
                x={d.mx}
                y={d.my - 4.5}
                fontSize="3"
                fill="var(--ink-2)"
                textAnchor="middle"
                style={{ fontFamily: "'IBM Plex Sans KR',sans-serif" }}
              >
                {shortName(d.name)}
              </text>
            </g>
          );
        })}
      </svg>

      <div className="maplegend">
        <span>
          <i style={{ background: "var(--brand)" }} />
          추천 상위 5곳
        </span>
        <span>
          <i style={{ border: "1.5px solid var(--muted)" }} />그 외 후보
        </span>
        <span>
          <i style={{ background: "var(--brand-tint)" }} />
          한강
        </span>
      </div>
    </div>
  );
}
