/* 출처 고지 (PRD §18 라이선스 — 공공누리 제1유형, 화면에 출처 명시 의무) */
export default function SiteFooter() {
  return (
    <footer>
      출처: 서울 열린데이터광장(data.seoul.go.kr) · 우리마을가게 상권분석서비스 · 제공 서울신용보증재단 ·
      공공누리 제1유형. 본 화면은 경진대회용 프로토타입으로, 표시된 상권 지표·Score·근거 문장은 구조
      시연을 위한 <b>목업 데이터</b>이며 실제 분석 결과가 아닙니다. 실제 서비스에서는
      상권_코드(표준단위구역) 기준으로 5종 데이터셋을 결정론적 Pandas 코드로 결합하고, Temporal
      Backtest한 <b>LightGBM</b>이 상권×업종 생존 안정성 Score를 산출하며, <b>Recommendation · Risk ·
      Verification</b> 3개 Claude 에이전트가 근거를 생성하고 원본 데이터 검증 Tool로 대조합니다. Score는
      개별 점포의 생존확률이 아니라 상권×업종 단위의 폐업위험/생존 안정성 지표입니다.
    </footer>
  );
}
