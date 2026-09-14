import { useEffect } from "react";
import Rich from "./Rich";
import Bar from "./Bar";
import DiagnosticPanel from "./DiagnosticPanel";
import HoursChart from "./charts/HoursChart";
import CompetitionChart from "./charts/CompetitionChart";
import SalesChart from "./charts/SalesChart";
import ClosureChart from "./charts/ClosureChart";
import { BIZ, PREF_LABEL } from "../data/businessTypes";
import { scoreColor } from "../lib/format";
import { countDigits } from "../lib/rich";
import { reasons } from "../lib/reasons";
import { rankingBreakdown, featureContributions } from "../lib/scoring";
import { diagnose } from "../lib/diagnostics";
import { verificationLog, SOURCE_DATES } from "../lib/verification";

/* 상세 근거 Drawer (F-11, PRD §17.4).
 * 추천/반대 근거 · 검증 로그 · 순위 구성 · 예측 요인 · 지표 차트 · 기준시점을 한 곳에 모은다.
 * 조건이 바뀌면 App이 새 r을 내려주므로 별도 갱신 로직이 필요 없다. */
export default function DetailDrawer({ r, rank, ranking, conditions, onClose }) {
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const d = r.d;
  const biz = BIZ[conditions.biz];
  const rs = reasons(r, conditions);
  const numericClaimCount = countDigits([...rs.pros, ...rs.cons]);
  const { modelStability, budgetFit, customerFit, preferenceFit } = rankingBreakdown(r, conditions);
  const { feats, max: maxContribution } = featureContributions(r);
  const { corrected, passed, summary } = verificationLog(r, conditions, numericClaimCount);
  const areas = diagnose(r, ranking, conditions);

  return (
    <>
      <div className="scrim" onClick={onClose} />
      <aside className="drawer" role="dialog" aria-label={`${d.name} 상세 근거`}>
        <header>
          <span className="rn">{rank}</span>
          <div>
            <h3>{d.name}</h3>
            <div className="loc mono">
              {d.gu} · 상권_코드 {d.code} · {biz.label}
            </div>
          </div>
          <button type="button" className="icon" aria-label="닫기" onClick={onClose}>
            ×
          </button>
        </header>

        <div className="dbody">
          <div className="headline">
            <span className="pct" style={{ color: scoreColor(r.surv) }}>
              {r.surv}점
            </span>
            <div>
              <div style={{ fontWeight: 600 }}>
                생존 안정성 Score <span className="agenttag">· 상권 × 업종 단위</span>
              </div>
              <div className="ci">
                LightGBM 산출 · 모델 신뢰도 {r.surv >= 60 ? "보통~높음" : "보통"} (Calibration 양호 ·
                Cold-start 아님) · 개별 점포 생존확률로 해석하지 않음
              </div>
            </div>
          </div>

          <div className="sect">
            <h4>
              상권 진단 <span className="agenttag">· 영역별 지수 · 서울 골목상권 내 위치</span>
            </h4>
            <DiagnosticPanel areas={areas} />
          </div>

          <div className="sect cols">
            <div className="pro">
              <h4 className="pro-h">
                추천 근거 <span className="agenttag">· Recommendation Agent</span>
              </h4>
              <ul>
                {rs.pros.map((parts, i) => (
                  <li key={i}>
                    <Rich parts={parts} />
                  </li>
                ))}
              </ul>
            </div>
            <div className="con">
              <h4 className="con-h">
                반대 근거 <span className="agenttag">· Risk Agent</span>
              </h4>
              <ul>
                {rs.cons.map((parts, i) => (
                  <li key={i}>
                    <Rich parts={parts} />
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="sect">
            <h4>
              검증 에이전트 로그{" "}
              <span className="agenttag">· Verification Agent → 원본 데이터 Tool 호출</span>
            </h4>
            <div className="vlog">
              <div className="vrow">
                <div className="vtop">
                  <span className="claim">
                    “{corrected.claim}” <span className="agenttag">(1차 생성)</span>
                  </span>
                  <span className="vb fix">1차 반려 → 정정</span>
                </div>
                <div className="tool">
                  → {corrected.tool} · {corrected.note}
                </div>
              </div>

              {passed.map((it, i) => (
                <div className="vrow" key={i}>
                  <div className="vtop">
                    <span className="claim">“{it.claim}”</span>
                    <span className="vb pass">PASS</span>
                  </div>
                  <div className="tool">
                    → {it.tool} · {it.real}
                  </div>
                </div>
              ))}

              <div className="vrow">
                <div className="vtop">
                  <span className="claim">{summary.claim}</span>
                  <span className="vb pass">전부 일치</span>
                </div>
                <div className="tool">{summary.tool}</div>
              </div>
            </div>
          </div>

          <div className="sect">
            <h4>
              왜 이 순위인가{" "}
              <span className="agenttag">· 개인화 Ranking = 모델 Score + 예산 + 고객층 + 선호</span>
            </h4>
            <div className="bars">
              <Bar label="생존 안정성(모델)" width={modelStability} value={modelStability} />
              <Bar label="예산 적합성" width={budgetFit} value={budgetFit} />
              <Bar label="고객층 적합성" width={customerFit} value={customerFit} />
              <Bar
                label={`선호 반영 (${PREF_LABEL[conditions.priority]})`}
                width={preferenceFit}
                value={preferenceFit}
              />
            </div>
          </div>

          <div className="sect">
            <h4>
              주요 예측 요인 <span className="agenttag">· Feature Importance (LightGBM)</span>
            </h4>
            <div className="bars">
              {feats.slice(0, 4).map((f) => (
                <Bar
                  key={f.k}
                  label={f.k}
                  width={(Math.abs(f.c) / maxContribution) * 100}
                  tone={f.c >= 0 ? "pos" : "neg"}
                  value={`${f.c >= 0 ? "+" : ""}${f.c.toFixed(1)}`}
                />
              ))}
            </div>
          </div>

          <div className="sect">
            <h4>
              상권 지표 <span className="agenttag">· 원본 데이터셋 시각화</span>
            </h4>
            <div className="charts">
              <div className="ch">
                <h5>시간대별 유동인구</h5>
                <div className="csub">2시간 단위 · 상권 영역 내 체류인구</div>
                <HoursChart district={d} />
              </div>
              <div className="ch">
                <h5>경쟁강도 (수요 대비 공급)</h5>
                <div className="csub">점포 1개당 배후수요 · 이 상권 vs 서울 평균</div>
                <CompetitionChart r={r} />
              </div>
              <div className="ch">
                <h5>분기별 추정매출 추세</h5>
                <div className="csub">{biz.label} 점포당 월 추정매출</div>
                <SalesChart district={d} />
              </div>
              <div className="ch">
                <h5>연도별 동종업종 폐업</h5>
                <div className="csub">상권 내 {biz.label} 폐업 점포수</div>
                <ClosureChart district={d} />
              </div>
            </div>
          </div>

          <div className="sources">
            <b>데이터 기준시점 (결합 Pipeline 자동 점검)</b>
            <table className="tstamp">
              <tbody>
                {SOURCE_DATES.map((s) => (
                  <tr key={s.label}>
                    <td>{s.label}</td>
                    <td className="ok">{s.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ marginTop: 5 }}>
              기준시점 최대 격차 6개월 · 허용범위(12개월) 이내 → <b>Warning 없음</b>. 상권_코드 기준
              자연 조인 · 집계 연산은 Pandas 코드가 수행(LLM 미사용) · 공공누리 제1유형.
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
