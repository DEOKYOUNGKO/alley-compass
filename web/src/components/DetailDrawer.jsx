import { useEffect, useState } from "react";
import Bar from "./Bar";
import { fetchAgents } from "../data/api";
import { scoreColor } from "../lib/format";

const AXIS_LABEL = {
  demand: "수요 (유동·상주·직장인구)",
  competition: "경쟁 여유 (점포당 배후수요)",
  performance: "매출 추세",
  access: "교통·집객 접근성",
  stability: "폐업 추세 안정성",
};

/* 상세 근거 Drawer (F-11, PRD §17.4).
 *
 * 왜 이 순위인가(score_breakdown)는 backend /rank가 이미 계산해서 내려준
 * 실제 값이라 열자마자 보여준다. 추천/반대 근거는 다르다 — Claude를
 * 실제로 호출하는 POST /districts/{code}/agents는 15~20초 걸리고 호출마다
 * 과금되므로, 자동으로 부르지 않고 "생성하기" 버튼으로 사용자가 명시적으로
 * 트리거해야 부른다. */
export default function DetailDrawer({ r, rank, conditions, bizLabel, asOf, modelVersion, onClose }) {
  const [agents, setAgents] = useState(null); // null | {loading, error, data}

  useEffect(() => {
    setAgents(null); // 다른 상권을 열면 이전 결과를 지운다
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [r.district_code, onClose]);

  const generate = () => {
    setAgents({ loading: true, error: null, data: null });
    fetchAgents(r.district_code, {
      businessCode: conditions.biz,
      budget: conditions.budget,
      age: conditions.age,
      character: conditions.character,
      priority: conditions.priority,
    })
      .then((data) => setAgents({ loading: false, error: null, data }))
      .catch((e) => setAgents({ loading: false, error: e.message, data: null }));
  };

  const breakdown = r.score_breakdown || {};

  return (
    <>
      <div className="scrim" onClick={onClose} />
      <aside className="drawer" role="dialog" aria-label={`${r.district_name} 상세 근거`}>
        <header>
          <span className="rn">{rank}</span>
          <div>
            <h3>{r.district_name}</h3>
            <div className="loc mono">
              상권_코드 {r.district_code} · {bizLabel}
            </div>
          </div>
          <button type="button" className="icon" aria-label="닫기" onClick={onClose}>
            ×
          </button>
        </header>

        <div className="dbody">
          <div className="headline">
            <span className="pct" style={{ color: scoreColor(r.final_score) }}>
              {r.final_score}점
            </span>
            <div>
              <div style={{ fontWeight: 600 }}>
                생존 안정성 Score <span className="agenttag">· 상권 × 업종 단위</span>
              </div>
              <div className="ci">
                모델 버전 <code>{modelVersion}</code>
                {modelVersion === "heuristic-v0" && " (LightGBM 학습 전 — 원본 feature 기반 임시 Score)"} ·
                기준시점 {asOf} · 개별 점포 생존확률로 해석하지 않음
              </div>
            </div>
          </div>

          <div className="sect">
            <h4>
              왜 이 순위인가{" "}
              <span className="agenttag">· 서울 골목상권 {r.rank === 1 ? "1위" : `${r.rank}위`} 내 백분위</span>
            </h4>
            <div className="bars">
              {Object.entries(AXIS_LABEL).map(([key, label]) => {
                const v = breakdown[key];
                return v === null || v === undefined ? (
                  <div className="bar" key={key} style={{ color: "var(--muted)" }}>
                    <span>{label}</span>
                    <span className="track" />
                    <span className="val">데이터 부족</span>
                  </div>
                ) : (
                  <Bar key={key} label={label} width={v} value={Math.round(v)} />
                );
              })}
            </div>
          </div>

          <div className="sect cols">
            <div className="pro">
              <h4 className="pro-h">
                추천 근거 <span className="agenttag">· Recommendation Agent</span>
              </h4>
              {renderAgentList(agents, "recommendation")}
            </div>
            <div className="con">
              <h4 className="con-h">
                반대 근거 <span className="agenttag">· Risk Agent</span>
              </h4>
              {renderAgentList(agents, "risk")}
            </div>
          </div>

          {!agents && (
            <button type="button" className="chip" style={{ alignSelf: "flex-start" }} onClick={generate}>
              추천 · 반대 근거 생성하기 (Claude 호출, 15~20초 소요)
            </button>
          )}
          {agents?.loading && <div className="ci">Claude가 근거를 생성하고 검증하는 중… (15~20초)</div>}
          {agents?.error && (
            <div className="ci" style={{ color: "var(--risk-ink)" }}>
              생성 실패: {agents.error}
            </div>
          )}
          {agents?.data && (
            <div className="sect">
              <h4>
                검증 요약 <span className="agenttag">· Verification Agent</span>
              </h4>
              <VerifySummary data={agents.data} />
            </div>
          )}

          <div className="sources">
            <b>데이터 기준시점</b> — {asOf} (서울 열린데이터광장 · 우리마을가게 상권분석서비스, 공공누리 제1유형)
          </div>
        </div>
      </aside>
    </>
  );
}

function renderAgentList(agents, key) {
  if (!agents) {
    return <p className="ci">아래 버튼을 누르면 이 상권에 대한 실제 근거를 생성합니다.</p>;
  }
  if (agents.loading) return <p className="ci">생성 중…</p>;
  if (agents.error) return null;
  const claims = (agents.data?.[key] || []).filter((c) => c.verified);
  if (claims.length === 0) {
    return <p className="ci">검증을 통과한 문장이 없습니다. 다시 생성해보세요.</p>;
  }
  return (
    <ul>
      {claims.map((c, i) => (
        <li key={i}>
          {c.claim_text}
          {c.corrected && <span className="agenttag"> (검증 후 정정됨)</span>}
        </li>
      ))}
    </ul>
  );
}

function VerifySummary({ data }) {
  const all = [...data.recommendation, ...data.risk];
  const corrected = all.filter((c) => c.corrected).length;
  const dropped = all.filter((c) => !c.verified).length;
  return (
    <p className="ci">
      전체 {all.length}개 문장 · 1차 반려 후 정정 {corrected}개 · 최종 제외 {dropped}개 — Claude가 문장에 적은
      수치를 원본 데이터와 Assertion Validator로 대조한 결과입니다.
    </p>
  );
}
