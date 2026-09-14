/* 1순위 페르소나 배너 (PRD §5.1) — 이 화면이 누구를 위한 것인지 고정 설명. */
export default function PersonaBanner() {
  return (
    <section className="persona">
      <div className="who">
        <span className="kick">1순위 페르소나</span>
        <h1>생애 첫 창업 · 위치 미정형</h1>
      </div>
      <div>
        <p className="body">
          30대 중반~40대 초반. 퇴직·퇴사 후 첫 창업을 준비하며 요식업·생활서비스업을 고려 중이다. 보증금{" "}
          <b>3,000만~1억 원</b>의 제한된 초기자본, 상권분석 전문지식은 없다. 지금은 유튜브·블로그·지인
          추천·부동산·발품·무료 상권분석 서비스를 각각 확인한 뒤 <b>감각적으로 종합</b>한다.
        </p>
        <p className="body" style={{ marginTop: 6 }}>
          <b>Pain</b> — “정보는 많은데, 그래서 내가 어디에 열어야 하는지 모르겠다.”
        </p>
        <ul className="needs">
          <li>후보지를 빠르게 좁혀주는 탐색</li>
          <li>추천 + 위험요인까지 설명</li>
          <li>숫자의 출처·기준시점 확인</li>
          <li>예산·업종 바꿔가며 비교</li>
        </ul>
        <div className="priority">
          <span>의사결정 우선순위</span>
          <ol>
            <li>생존 안정성</li>
            <li>예산 적합성</li>
            <li>고객층 적합성</li>
            <li>성장 가능성</li>
          </ol>
        </div>
      </div>
    </section>
  );
}
