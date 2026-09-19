/* 상단 바 — 브랜드 + 모델/AI 신뢰지표 스트립.
 * 랭킹·근거 문장은 이제 실제 backend(FastAPI)에서 온다. 다만 이 trust
 * 스트립의 모델 성능 숫자(ROC-AUC 등, PRD §20 KPI)는 LightGBM을 아직 학습
 * 전이라 여전히 목업이다 — model_versions 테이블에 실제 값이 쌓이면 여기를
 * 그 값으로 바꾼다. 기준시점은 상권마다 달라 상세 Drawer에서 실제 값을
 * 보여주므로 여기선 빼뒀다. */
export default function TopBar() {
  return (
    <div className="topbar">
      <div className="wrap">
        <div className="brandrow">
          <svg className="mark" viewBox="0 0 32 32" fill="none" aria-hidden="true">
            <circle cx="16" cy="16" r="13" stroke="currentColor" strokeWidth="2" />
            <path d="M16 6 L19 15 L16 26 L13 15 Z" fill="currentColor" />
            <circle cx="16" cy="16" r="2" fill="var(--surface)" />
          </svg>
          <span className="wordmark">
            <b>골목 컴퍼스</b>
            <span>Alley Compass</span>
          </span>
          <span className="tag">실데이터 랭킹 · 모델 성능지표는 목업</span>
        </div>
        <dl className="trust">
          <div>
            <dt>ROC-AUC · PR-AUC</dt>
            <dd>
              <span className="big">0.82</span>· 0.71 <span className="mono">(Temporal Test 2024)</span>
            </dd>
          </div>
          <div>
            <dt>Brier · Calibration</dt>
            <dd>
              0.14 · <span className="delta">양호</span>
            </dd>
          </div>
          <div>
            <dt>Top-K 안정성 Lift</dt>
            <dd>
              <span className="delta">+37%</span> 추천 Top 5 vs 서울 평균
            </dd>
          </div>
          <div>
            <dt>Agent 반려율 · 검증불가 주장</dt>
            <dd>
              14% · <span className="delta">0%</span>
            </dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
