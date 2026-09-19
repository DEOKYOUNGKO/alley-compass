import { useEffect, useRef, useState } from "react";
import TopBar from "./components/TopBar";
import PersonaBanner from "./components/PersonaBanner";
import ConditionPanel from "./components/ConditionPanel";
import ConversationPanel from "./components/ConversationPanel";
import MapCard from "./components/MapCard";
import RankList from "./components/RankList";
import DetailDrawer from "./components/DetailDrawer";
import SiteFooter from "./components/SiteFooter";
import { fetchBusinessTypes, fetchRank } from "./data/api";
import { INITIAL_CONDITIONS } from "./data/businessTypes";
import { b } from "./lib/rich";

const BUDGET_DEBOUNCE_MS = 500;

function initialMessage(res) {
  const lead = res.results[0];
  if (!lead) {
    return [`업종 "${res.business_name}"에 해당하는 상권 데이터가 없습니다.`];
  }
  return [
    "서울 골목상권 ",
    b(`${res.n_candidates.toLocaleString("en-US")}곳`),
    `을 조건에 맞게 재랭킹했습니다. `,
    b(res.business_name),
    " 기준 1위는 ",
    b(lead.district_name),
    `(생존 안정성 ${lead.final_score}점)입니다. `,
    "행을 누르면 상세 지표와 추천·반대 근거를 볼 수 있어요.",
    ...(res.warnings.length ? [" ⚠ ", res.warnings.join(" ")] : []),
  ];
}

function changeMessage(labelParts, prevTopNames, res) {
  const lead = res.results[0];
  const now = res.results.slice(0, 5).map((r) => r.district_name);
  const changed = now.filter((n) => !prevTopNames.includes(n)).length;
  return [
    ...labelParts,
    " 서버가 조건을 반영해 서울 전체를 다시 계산했습니다. 상위 5곳 중 ",
    b(`${changed}곳`),
    "이 바뀌었고, 1위는 ",
    b(lead ? lead.district_name : "없음"),
    lead ? `(생존 안정성 ${lead.final_score}점)입니다.` : "입니다.",
    ...(res.warnings.length ? [" ⚠ ", res.warnings.join(" ")] : []),
  ];
}

export default function App() {
  const [bizOptions, setBizOptions] = useState([]);
  const [conditions, setConditions] = useState(INITIAL_CONDITIONS);
  const [ranking, setRanking] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCode, setSelectedCode] = useState(null);

  const messageId = useRef(0);
  const [messages, setMessages] = useState([]);
  const budgetTimer = useRef(null);
  const bootstrapped = useRef(false);

  const say = (from, parts) => setMessages((prev) => [...prev, { id: messageId.current++, from, parts }]);

  const runRank = (next, { onDone } = {}) => {
    setLoading(true);
    fetchRank({
      businessCode: next.biz,
      budget: next.budget,
      age: next.age,
      character: next.character,
      priority: next.priority,
      topK: 20,
    })
      .then((res) => {
        setRanking(res.results);
        setMeta(res);
        setError(null);
        onDone?.(res);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  // 최초 진입: 실제로 수집된 업종 목록을 받아온 뒤 그 중 첫 업종으로 첫 랭킹을 돌린다.
  useEffect(() => {
    fetchBusinessTypes()
      .then((rows) => {
        const opts = rows.map((r) => ({ value: r.business_code, label: r.business_name }));
        setBizOptions(opts);
        if (opts.length === 0) {
          setError("수집된 업종이 없습니다. alley_compass_etl.py로 먼저 데이터를 받으세요.");
          setLoading(false);
          return;
        }
        const first = { ...INITIAL_CONDITIONS, biz: opts[0].value };
        setConditions(first);
        runRank(first, {
          onDone: (res) => {
            if (!bootstrapped.current) {
              bootstrapped.current = true;
              say("bot", initialMessage(res));
            }
          },
        });
      })
      .catch((e) => {
        setError(e.message);
        setLoading(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const top5Codes = ranking.slice(0, 5).map((r) => r.district_code);
  const selectedIndex = ranking.findIndex((r) => r.district_code === selectedCode);
  const selected = selectedIndex >= 0 ? ranking[selectedIndex] : null;

  const applyChange = (patch, labelParts, userParts) => {
    const prevTopNames = ranking.slice(0, 5).map((r) => r.district_name);
    const next = { ...conditions, ...patch };
    setConditions(next);
    if (userParts) say("user", userParts);
    runRank(next, { onDone: (res) => say("bot", changeMessage(labelParts, prevTopNames, res)) });
  };

  const handleBizChange = (value) => {
    const label = bizOptions.find((o) => o.value === value)?.label || value;
    applyChange({ biz: value }, ["업종을 ", b(label), "(으)로 바꿨습니다. 서울 전체를 다시 계산합니다."]);
  };

  // 슬라이더는 연속적으로 값이 바뀌므로 값만 즉시 반영하고, API 호출은 디바운스한다.
  const handleBudgetChange = (value) => {
    setConditions((c) => ({ ...c, budget: value }));
    clearTimeout(budgetTimer.current);
    budgetTimer.current = setTimeout(() => {
      setConditions((c) => {
        runRank(c);
        return c;
      });
    }, BUDGET_DEBOUNCE_MS);
  };

  const handleSegChange = (id, value, optionLabel, groupLabel) =>
    applyChange({ [id]: value }, [`${groupLabel} 조건을 `, b(`"${optionLabel}"`), "(으)로 바꿨습니다."]);

  const otherBiz = bizOptions.find((o) => o.value !== conditions.biz);

  const handleChip = (act) => {
    if (act === "reset") {
      const first = { ...INITIAL_CONDITIONS, biz: bizOptions[0]?.value || "" };
      setConditions(first);
      say("user", ["처음 조건으로 되돌려줘"]);
      runRank(first, {
        onDone: () =>
          say("bot", [
            "최초 조건(",
            b(bizOptions[0]?.label || ""),
            " · 보증금 5,000만원 이하 · 20–30대 · 유동인구 중심 · 생존 안정성 우선)으로 초기화했습니다.",
          ]),
      });
    } else if (act === "switchBiz" && otherBiz) {
      applyChange(
        { biz: otherBiz.value },
        ["업종을 ", b(otherBiz.label), "(으)로 바꿨어요."],
        [`${bizOptions.find((o) => o.value === conditions.biz)?.label || ""} 말고 ${otherBiz.label}는?`]
      );
    } else if (act === "budget3000") {
      applyChange({ budget: 3000 }, ["보증금 상한을 ", b("3,000만원"), "으로 낮췄습니다."], [
        "예산을 3,000만원으로 낮추면?",
      ]);
    } else if (act === "age20") {
      applyChange({ age: "20" }, ["수요 레이어를 ", b("20대 유동인구"), "로 좁혔습니다."], [
        "20대 유동인구만 볼게",
      ]);
    } else if (act === "resident") {
      applyChange(
        { character: "resident" },
        ["상권 성격을 ", b("주거 배후"), "로 바꿨습니다."],
        ["조용한 주거 배후가 좋아"]
      );
    }
  };

  return (
    <>
      <TopBar />

      <div className="wrap">
        <PersonaBanner />

        <div className="console">
          <aside className="rail">
            <ConditionPanel
              conditions={conditions}
              bizOptions={bizOptions}
              onBizChange={handleBizChange}
              onBudgetChange={handleBudgetChange}
              onSegChange={handleSegChange}
            />
            <ConversationPanel messages={messages} onChip={handleChip} altBusinessLabel={otherBiz?.label} />
          </aside>

          <section className="board">
            <div className="board-head">
              <h2>내 조건에서 살아남을 가능성이 높은 골목상권</h2>
              <div className="sub">
                {error ? (
                  <span style={{ color: "var(--risk-ink)" }}>{error}</span>
                ) : loading && !meta ? (
                  "불러오는 중…"
                ) : meta ? (
                  <>
                    분석 대상 서울 골목상권 {meta.n_candidates.toLocaleString("en-US")}곳 · {meta.business_name} 기준 ·
                    {loading ? " 재계산 중…" : ` 모델 ${meta.model_version}`}
                  </>
                ) : null}
              </div>
            </div>

            <MapCard ranking={ranking.slice(0, 5)} selectedCode={selectedCode} onSelect={setSelectedCode} />

            <RankList ranking={ranking} selectedCode={selectedCode} onSelect={setSelectedCode} />
          </section>
        </div>
      </div>

      <SiteFooter />

      {selected && (
        <DetailDrawer
          r={selected}
          rank={selectedIndex + 1}
          conditions={conditions}
          bizLabel={bizOptions.find((o) => o.value === conditions.biz)?.label || conditions.biz}
          asOf={meta?.as_of}
          modelVersion={meta?.model_version}
          onClose={() => setSelectedCode(null)}
        />
      )}
    </>
  );
}
