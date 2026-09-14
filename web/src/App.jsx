import { useMemo, useRef, useState } from "react";
import TopBar from "./components/TopBar";
import PersonaBanner from "./components/PersonaBanner";
import ConditionPanel from "./components/ConditionPanel";
import ConversationPanel from "./components/ConversationPanel";
import MapCard from "./components/MapCard";
import RankList from "./components/RankList";
import DetailDrawer from "./components/DetailDrawer";
import SiteFooter from "./components/SiteFooter";
import { useDistricts } from "./data/dataSource";
import { BIZ, INITIAL_CONDITIONS } from "./data/businessTypes";
import { rankDistricts } from "./lib/scoring";
import { b } from "./lib/rich";

/* 조건이 바뀔 때마다 대화 로그에 남기는 요약.
 * "데이터를 다시 수집하지 않고 기존 결합 데이터 + 모델을 재사용해 재랭킹한다"는
 * PRD §6·§17.5의 핵심 메시지를 그대로 전달한다. */
function summarize(prevTopNames, labelParts, nextRanking) {
  const now = nextRanking.slice(0, 5).map((r) => r.d.name);
  const changed = now.filter((n) => !prevTopNames.includes(n)).length;
  const lead = nextRanking[0];
  return [
    ...labelParts,
    " 이미 결합된 상권_코드 데이터와 학습된 모델을 ",
    b("재사용"),
    "해 전체 재분석 없이 다시 Ranking했어요. 상위 5곳 중 ",
    b(`${changed}곳`),
    "이 바뀌었고, 1위는 ",
    b(lead.d.name),
    `(생존 안정성 ${lead.surv}점)입니다.`,
  ];
}

function initialMessage(ranking) {
  const lead = ranking[0];
  return [
    "서울 골목상권 ",
    b("1,090곳"),
    "을 A씨 조건으로 재평가했습니다. 20대 유동인구는 연남동·샤로수길이 최고지만, 동종 카페 과포화·예산 초과로 ",
    b("미래 생존 안정성은 오히려 낮습니다"),
    ". 매출 상승·낮은 경쟁밀도·예산 적합성이 겹친 ",
    b(lead.d.name),
    `이(가) 1위(생존 안정성 ${lead.surv}점)입니다. 행을 누르면 추천·반대 근거, 검증 로그, 예측 요인을 볼 수 있어요.`,
  ];
}

export default function App() {
  const { districts } = useDistricts();
  const [conditions, setConditions] = useState(INITIAL_CONDITIONS);
  const [selectedCode, setSelectedCode] = useState(null);
  const messageId = useRef(0);

  const [messages, setMessages] = useState(() => [
    {
      id: messageId.current++,
      from: "bot",
      parts: initialMessage(rankDistricts(districts, INITIAL_CONDITIONS)),
    },
  ]);

  const ranking = useMemo(() => rankDistricts(districts, conditions), [districts, conditions]);
  const top5Codes = ranking.slice(0, 5).map((r) => r.d.code);
  const budgetFitCount = ranking.filter((r) => r.deposit <= conditions.budget).length;

  const selectedIndex = ranking.findIndex((r) => r.d.code === selectedCode);
  const selected = selectedIndex >= 0 ? ranking[selectedIndex] : null;

  const say = (from, parts) =>
    setMessages((prev) => [...prev, { id: messageId.current++, from, parts }]);

  /** 조건을 바꾸고, 바뀐 조건으로 계산한 새 랭킹 요약을 대화 로그에 남긴다. */
  const applyChange = (patch, labelParts, userParts) => {
    const prevTopNames = ranking.slice(0, 5).map((r) => r.d.name);
    const next = { ...conditions, ...patch };
    const nextRanking = rankDistricts(districts, next);
    setConditions(next);
    if (userParts) say("user", userParts);
    say("bot", summarize(prevTopNames, labelParts, nextRanking));
  };

  const handleBizChange = (value) =>
    applyChange({ biz: value }, [
      "업종을 ",
      b(BIZ[value].label),
      "(으)로 바꿨습니다. 수요·경쟁·폐업 추세 가중치가 업종에 맞게 재조정됩니다.",
    ]);

  // 슬라이더는 연속적으로 값이 바뀌므로 대화 로그를 남기지 않는다 (원본 동작과 동일).
  const handleBudgetChange = (value) => setConditions((c) => ({ ...c, budget: value }));

  const handleSegChange = (id, value, optionLabel, groupLabel) =>
    applyChange({ [id]: value }, [
      `${groupLabel} 조건을 `,
      b(`“${optionLabel}”`),
      "(으)로 바꿨습니다.",
    ]);

  const handleChip = (act) => {
    if (act === "reset") {
      setConditions(INITIAL_CONDITIONS);
      say("user", ["처음 조건으로 되돌려줘"]);
      say("bot", [
        "A씨의 최초 조건(커피·음료 · 보증금 5,000만원 이하 · 20–30대 · 유동인구 중심 · 생존 안정성 우선)으로 초기화했습니다.",
      ]);
      return;
    }

    if (act === "laundry") {
      applyChange(
        { biz: "laundry" },
        [
          "세탁·수선 기준으로 바꿨어요. 데이터를 다시 수집하지 않고 유동인구 가중치를 내리고 ",
          b("상주인구·폐업 추세"),
          " 가중치를 올렸습니다.",
        ],
        ["카페 말고 세탁소는?"]
      );
    } else if (act === "budget3000") {
      applyChange(
        { budget: 3000 },
        ["보증금 상한을 ", b("3,000만원"), "으로 낮췄습니다. 예산을 초과하는 후보는 적합도가 감소합니다."],
        ["예산을 3,000만원으로 낮추면?"]
      );
    } else if (act === "age20") {
      applyChange(
        { age: "20" },
        ["수요 레이어를 ", b("20대 유동인구"), "로 좁혔습니다."],
        ["20대 유동인구만 볼게"]
      );
    } else if (act === "resident") {
      applyChange(
        { character: "resident" },
        [
          "상권 성격을 ",
          b("주거 배후"),
          "로 바꿨습니다. 상주인구 비중이 큰 골목이 상위로 올라옵니다.",
        ],
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
              onBizChange={handleBizChange}
              onBudgetChange={handleBudgetChange}
              onSegChange={handleSegChange}
            />
            <ConversationPanel messages={messages} onChip={handleChip} />
          </aside>

          <section className="board">
            <div className="board-head">
              <h2>내 조건에서 살아남을 가능성이 높은 골목상권</h2>
              <div className="sub">
                분석 대상 서울 골목상권 1,090곳 · 예산 이내 후보 {budgetFitCount}곳 ·{" "}
                {BIZ[conditions.biz].label} · 조건 변경 시 수 초 내 전체 재랭킹
              </div>
            </div>

            <MapCard
              districts={districts}
              top5Codes={top5Codes}
              selectedCode={selectedCode}
              onSelect={setSelectedCode}
            />

            <RankList
              ranking={ranking}
              conditions={conditions}
              selectedCode={selectedCode}
              onSelect={setSelectedCode}
            />
          </section>
        </div>
      </div>

      <SiteFooter />

      {selected && (
        <DetailDrawer
          r={selected}
          rank={selectedIndex + 1}
          ranking={ranking}
          conditions={conditions}
          onClose={() => setSelectedCode(null)}
        />
      )}
    </>
  );
}
