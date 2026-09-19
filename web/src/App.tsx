import { useCallback, useEffect, useRef, useState } from "react";

import { AppHeader } from "@/components/AppHeader";
import { AskPanel, type Message, type QuickAskAction } from "@/components/AskPanel";
import { ConditionBar } from "@/components/ConditionBar";
import { DataStatusCard } from "@/components/DataStatusCard";
import { DistrictDrawer } from "@/components/detail/DistrictDrawer";
import { RankList } from "@/components/RankList";
import { ResultSummary } from "@/components/ResultSummary";
import { SiteFooter } from "@/components/SiteFooter";
import { Button, Card, CardBody, type SelectOption } from "@/components/ui";
import {
  AGE_LABEL,
  CHARACTER_LABEL,
  INITIAL_CONDITIONS,
  PRIORITY_LABEL,
} from "@/data/businessTypes";
import { ApiError, fetchBusinessTypes, fetchRank } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { fmt } from "@/lib/format";
import { b, type RichParts } from "@/lib/rich";
import type { RankResponse } from "@/types/api";
import type { Conditions } from "@/types/domain";

/* ──────────────────────────────────────────────────────────────
 * 화면 조립 + 조건 state 소유.
 *
 * 데이터는 전부 backend 에서 온다. 프론트에서 점수를 계산하지 않는다 —
 * 랭킹 로직이 backend/scoring.py 한 곳에만 있어야 화면 숫자와
 * verification_tools.py 의 판정이 어긋나지 않기 때문이다.
 *
 * 호출 정책
 *   업종·연령·성격·우선순위 변경 → 즉시 /rank 재호출
 *   예산 슬라이더               → 500ms 디바운스 (드래그 중 매 프레임 호출 방지)
 *   추천 이유 생성              → 사용자가 버튼을 눌러야 (AI 호출 비용)
 * ────────────────────────────────────────────────────────────── */

const BUDGET_DEBOUNCE_MS = 500;
const TOP_K = 20;

function bootMessage(res: RankResponse): RichParts {
  const lead = res.results[0];
  if (!lead) return [`업종 "${res.business_name}"에 해당하는 상권 데이터가 없습니다.`];

  return [
    "서울 골목상권 ",
    b(`${fmt(res.n_candidates)}곳`),
    "을 조건에 맞춰 비교했습니다. ",
    b(res.business_name),
    " 기준 1위는 ",
    b(lead.district_name),
    `(생존 안정성 ${Math.round(lead.final_score)}점)입니다. 상권을 누르면 진단과 자세한 지표를 볼 수 있어요.`,
    ...(res.warnings.length ? [" ", res.warnings.join(" ")] : []),
  ];
}

function changeMessage(
  labelParts: RichParts,
  previousTopNames: readonly string[],
  res: RankResponse,
): RichParts {
  const lead = res.results[0];
  const now = res.results.slice(0, 5).map((r) => r.district_name);
  const changed = now.filter((name) => !previousTopNames.includes(name)).length;

  return [
    ...labelParts,
    " 서울 골목상권 전체를 다시 비교했습니다. 상위 5곳 중 ",
    b(`${changed}곳`),
    "이 바뀌었고, 1위는 ",
    b(lead ? lead.district_name : "없음"),
    lead ? `(생존 안정성 ${Math.round(lead.final_score)}점)입니다.` : "입니다.",
    ...(res.warnings.length ? [" ", res.warnings.join(" ")] : []),
  ];
}

export default function App() {
  const { signOut } = useAuth();
  const [bizOptions, setBizOptions] = useState<SelectOption[]>([]);
  const [conditions, setConditions] = useState<Conditions>(INITIAL_CONDITIONS);
  const [meta, setMeta] = useState<RankResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCode, setSelectedCode] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);

  const messageId = useRef(0);
  const budgetTimer = useRef<number | undefined>(undefined);
  const booted = useRef(false);

  const say = useCallback((from: Message["from"], parts: RichParts) => {
    setMessages((prev) => [...prev, { id: messageId.current++, from, parts }]);
  }, []);

  /* 세션이 끊기면(401) 에러 문구를 띄우는 대신 로그인 화면으로 돌려보낸다.
   * 만료된 세션으로 계속 시도해봐야 같은 실패만 반복된다. */
  const handleError = useCallback(
    (e: unknown) => {
      if (e instanceof ApiError && e.isUnauthorized) {
        void signOut(e.message || "세션이 만료되었습니다. 다시 로그인해 주세요.");
        return;
      }
      setError(e instanceof Error ? e.message : "잠시 후 다시 시도해 주세요.");
    },
    [signOut],
  );

  const runRank = useCallback(
    (next: Conditions, onDone?: (res: RankResponse) => void) => {
      if (!next.biz) return;

      setLoading(true);
      fetchRank(next, TOP_K)
        .then((res) => {
          setMeta(res);
          setError(null);
          onDone?.(res);
        })
        .catch(handleError)
        .finally(() => setLoading(false));
    },
    [handleError],
  );

  /* 최초 진입 — 실제로 수집된 업종을 받아 그중 첫 업종으로 첫 랭킹을 돌린다.
   * 업종 목록을 상수로 들고 있지 않는 이유: 아직 수집되지 않은 업종을
   * 드롭다운에 보여주면 404 를 부르는 선택지를 사용자에게 내미는 셈이다. */
  const bootstrap = useCallback(() => {
    setLoading(true);
    setError(null);

    fetchBusinessTypes()
      .then((rows) => {
        const options = rows.map((r) => ({ value: r.business_code, label: r.business_name }));
        setBizOptions(options);

        const first = options[0];
        if (!first) {
          setError(
            "지금은 분석할 수 있는 업종이 없습니다. 잠시 후 다시 시도해 주세요.",
          );
          setLoading(false);
          return;
        }

        const next = { ...INITIAL_CONDITIONS, biz: first.value };
        setConditions(next);
        runRank(next, (res) => {
          if (booted.current) return;
          booted.current = true;
          say("bot", bootMessage(res));
        });
      })
      .catch((e: unknown) => {
        handleError(e);
        setLoading(false);
      });
  }, [runRank, say, handleError]);

  useEffect(bootstrap, [bootstrap]);

  useEffect(() => () => window.clearTimeout(budgetTimer.current), []);

  const applyChange = (patch: Partial<Conditions>, labelParts: RichParts, userParts?: RichParts) => {
    const previousTopNames = (meta?.results ?? []).slice(0, 5).map((r) => r.district_name);
    const next = { ...conditions, ...patch };

    setConditions(next);
    if (userParts) say("user", userParts);
    runRank(next, (res) => say("bot", changeMessage(labelParts, previousTopNames, res)));
  };

  /* 슬라이더는 드래그 중 값이 연속으로 바뀐다. 매번 부르면 서버가 같은 계산을
   * 수십 번 하므로, 손이 멈춘 뒤에만 호출한다. 대화 로그도 남기지 않는다. */
  const handleBudgetChange = (budget: number) => {
    const next = { ...conditions, budget };
    setConditions(next);
    window.clearTimeout(budgetTimer.current);
    budgetTimer.current = window.setTimeout(() => runRank(next), BUDGET_DEBOUNCE_MS);
  };

  const handleReset = () => {
    const first = bizOptions[0];
    if (!first) return;

    const next = { ...INITIAL_CONDITIONS, biz: first.value };
    setConditions(next);
    say("user", ["처음 조건으로 되돌려줘"]);
    runRank(next, () =>
      say("bot", [
        `처음 조건(${first.label} · 보증금 ${fmt(INITIAL_CONDITIONS.budget)}만원 이하 · 20–30대 · 유동인구 중심 · 생존 안정성 우선)으로 되돌렸습니다.`,
      ]),
    );
  };

  const handleAsk = (action: QuickAskAction) => {
    switch (action) {
      case "otherBiz": {
        const current = bizOptions.findIndex((o) => o.value === conditions.biz);
        const nextOption = bizOptions[(current + 1) % bizOptions.length];
        if (!nextOption) return;

        applyChange(
          { biz: nextOption.value },
          ["업종을 ", b(nextOption.label), "(으)로 바꿨습니다."],
          ["다른 업종으로 보면?"],
        );
        break;
      }
      case "budget3000":
        applyChange(
          { budget: 3000 },
          ["보증금 상한을 ", b("3,000만원"), "으로 낮췄습니다."],
          ["예산을 3,000만원으로 낮추면?"],
        );
        break;
      case "age20":
        applyChange(
          { age: "20" },
          ["20대 유동인구가 많은 곳을 우선해 다시 찾았습니다."],
          ["20대 유동인구만 볼게"],
        );
        break;
      case "resident":
        applyChange(
          { character: "resident" },
          ["상권 성격을 ", b("주거 배후"), "로 바꿨습니다. 상주인구 비중이 큰 골목이 올라옵니다."],
          ["조용한 주거 배후가 좋아"],
        );
        break;
    }
  };

  const ranking = meta?.results ?? [];
  const selected = ranking.find((r) => r.district_code === selectedCode) ?? null;

  return (
    <>
      <div className="flex min-h-screen flex-col">
        <AppHeader />

        <ConditionBar
          conditions={conditions}
          bizOptions={bizOptions}
          onBizChange={(biz) => {
            const label = bizOptions.find((o) => o.value === biz)?.label ?? biz;
            applyChange({ biz }, ["업종을 ", b(label), "(으)로 바꿨습니다."]);
          }}
          onBudgetChange={handleBudgetChange}
          onAgeChange={(age) =>
            applyChange({ age }, ["타깃 연령을 ", b(AGE_LABEL[age]), "(으)로 바꿨습니다."])
          }
          onCharacterChange={(character) =>
            applyChange({ character }, [
              "상권 성격을 ",
              b(CHARACTER_LABEL[character]),
              "(으)로 바꿨습니다.",
            ])
          }
          onPriorityChange={(priority) =>
            applyChange({ priority }, [
              "우선순위를 ",
              b(PRIORITY_LABEL[priority]),
              "(으)로 바꿨습니다.",
            ])
          }
          onReset={handleReset}
        />

        <main className="mx-auto w-full max-w-[86rem] flex-1 px-4 py-6 sm:px-6">
          {error ? (
            <Card variant="nodata">
              <CardBody className="flex flex-col items-start gap-3 pt-4">
                <div>
                  <p className="text-sm font-semibold text-fg">데이터를 불러오지 못했습니다</p>
                  <p className="mt-1 max-w-[62ch] text-xs leading-relaxed text-fg-muted">{error}</p>
                </div>
                <Button variant="outline" size="sm" onClick={bootstrap}>
                  다시 시도
                </Button>
              </CardBody>
            </Card>
          ) : (
            <>
              <ResultSummary meta={meta} loading={loading} />

              <div className="mt-5 grid gap-5 lg:grid-cols-12">
                <div className="lg:col-span-8">
                  <RankList
                    ranking={ranking}
                    selectedCode={selectedCode}
                    onSelect={setSelectedCode}
                    loading={loading}
                  />
                </div>

                <aside className="flex flex-col gap-4 lg:col-span-4">
                  <DataStatusCard meta={meta} />
                  <AskPanel
                    messages={messages}
                    onAsk={handleAsk}
                    businessTypeCount={bizOptions.length}
                    busy={loading}
                  />
                </aside>
              </div>
            </>
          )}
        </main>

        <SiteFooter />
      </div>

      <DistrictDrawer
        r={selected}
        conditions={conditions}
        modelVersion={meta?.model_version ?? "—"}
        asOf={meta?.as_of ?? "—"}
        onClose={() => setSelectedCode(null)}
      />
    </>
  );
}
