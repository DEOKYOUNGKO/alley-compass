/* 상단 바 — 브랜드 + 모델/AI 신뢰지표 스트립.
 * trust 스트립의 숫자는 PRD §20 KPI 항목이며, 현재는 목업이다.
 * 실제로는 model_versions 테이블(ROC-AUC 등)과 verification_claims 집계에서 온다. */
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
          <span className="tag">프로토타입 · 목업 데이터</span>
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
          <div>
            <dt>데이터 기준시점</dt>
            <dd className="mono">유동 24-06 · 점포 24 · 매출 24Q2 · 집객 24 · 직장/상주 24H1</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
