/* 출처 고지 (PRD §18 라이선스 — 공공누리 제1유형, 화면에 출처 명시 의무) */
export default function SiteFooter() {
  return (
    <footer>
      출처: 서울 열린데이터광장(data.seoul.go.kr) · 우리마을가게 상권분석서비스 · 제공 서울신용보증재단 ·
      공공누리 제1유형. 상권 목록·점수·랭킹은 위 데이터를 결정론적 Pandas 코드로 결합한{" "}
      <b>실제 값</b>이며, 상권_코드(표준단위구역) 기준으로 조인됩니다. 다만 생존 안정성 Score는
      아직 Temporal Backtest한 <b>LightGBM 학습 전</b>이라 원본 feature 기반 임시 계산값(휴리스틱)
      입니다. 추천·반대 근거는 <b>Recommendation · Risk · Verification</b> 3개 Claude 에이전트가
      실시간 생성하고 원본 데이터 검증 Tool로 대조한 결과이며, "생성하기" 버튼을 눌러야 만들어집니다.
      Score는 개별 점포의 생존확률이 아니라 상권×업종 단위의 폐업위험/생존 안정성 지표입니다.
    </footer>
  );
}
