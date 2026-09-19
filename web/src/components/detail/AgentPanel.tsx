import { AlertTriangle, Loader2, Minus, Plus, ShieldCheck, Sparkles } from "lucide-react";
import { useState } from "react";

import { fetchAgents } from "@/lib/api";
import type { AgentResponse, VerifiedClaim } from "@/types/api";
import type { Conditions } from "@/types/domain";
import { Badge, Button, Card, CardBody, CardHeader, CardTitle, Tooltip } from "@/components/ui";

/* ──────────────────────────────────────────────────────────────
 * 추천 이유 · 주의할 점.
 *
 * 열자마자 자동으로 부르지 않는다. AI 호출이 15~20초 걸리고 비용이 들어서,
 * 사용자가 이 상권을 정말 볼 것인지 정한 뒤에만 부른다.
 *
 * 검증에 실패한 문장은 화면에 내보내지 않는다. 내부 용어(Agent 이름, 호출 횟수,
 * Tool 이름)는 사용자에게 의미가 없으므로 노출하지 않되, "숫자를 원본과
 * 대조했다"는 사실은 남긴다 — 그게 이 서비스를 믿을 이유이기 때문이다.
 * ────────────────────────────────────────────────────────────── */

type State =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "done"; data: AgentResponse };

export interface AgentPanelProps {
  districtCode: string;
  conditions: Conditions;
}

export function AgentPanel({ districtCode, conditions }: AgentPanelProps) {
  const [state, setState] = useState<State>({ status: "idle" });

  const generate = () => {
    setState({ status: "loading" });
    fetchAgents(districtCode, conditions)
      .then((data) => setState({ status: "done", data }))
      .catch((error: unknown) =>
        setState({
          status: "error",
          message: error instanceof Error ? error.message : "잠시 후 다시 시도해 주세요.",
        }),
      );
  };

  if (state.status === "idle") {
    return (
      <Card variant="sunken">
        <CardBody className="flex flex-col items-start gap-3 pt-4">
          <p className="max-w-[56ch] text-xs leading-relaxed text-fg-muted">
            이 상권의 지표를 바탕으로 추천할 만한 이유와 주의해야 할 점을 각각 정리해 드립니다.
            문장에 들어가는 수치는 원본 데이터와 대조한 것만 보여 드립니다.
          </p>
          <Button variant="solid" onClick={generate}>
            <Sparkles aria-hidden="true" className="size-3.5" />
            분석 받아보기
          </Button>
          <p className="text-2xs text-fg-subtle">15~20초 정도 걸립니다.</p>
        </CardBody>
      </Card>
    );
  }

  if (state.status === "loading") {
    return (
      <Card variant="sunken">
        <CardBody className="flex items-center gap-2.5 pt-4" aria-live="polite">
          <Loader2 aria-hidden="true" className="size-4 animate-spin text-accent" />
          <p className="text-xs text-fg-body">
            이 상권을 분석하고 수치를 확인하는 중입니다… (15~20초)
          </p>
        </CardBody>
      </Card>
    );
  }

  if (state.status === "error") {
    return (
      <Card variant="sunken">
        <CardBody className="flex flex-col items-start gap-3 pt-4">
          <p className="flex items-start gap-2 text-xs text-negative-text" role="alert">
            <AlertTriangle aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" />
            <span>분석을 완료하지 못했습니다 — {state.message}</span>
          </p>
          <Button variant="outline" size="sm" onClick={generate}>
            다시 시도
          </Button>
        </CardBody>
      </Card>
    );
  }

  const all = [...state.data.recommendation, ...state.data.risk];
  const shown = all.filter((c) => c.verified).length;

  return (
    <div className="flex flex-col gap-3">
      <div className="grid gap-3 md:grid-cols-2">
        <ClaimCard kind="pro" title="추천하는 이유" claims={state.data.recommendation} />
        <ClaimCard kind="con" title="주의할 점" claims={state.data.risk} />
      </div>

      <Tooltip
        content="AI가 문장에 적은 숫자를 원본 데이터와 하나씩 대조합니다. 값이 어긋난 문장은 다시 쓰게 하고, 그래도 맞지 않으면 보여 드리지 않습니다."
        side="top"
      >
        <p className="inline-flex w-fit cursor-help items-center gap-1.5 text-2xs text-fg-muted">
          <ShieldCheck aria-hidden="true" className="size-3.5 text-positive" />
          문장 {shown}개 모두 원본 데이터와 수치가 일치합니다
        </p>
      </Tooltip>
    </div>
  );
}

function ClaimCard({
  kind,
  title,
  claims,
}: {
  kind: "pro" | "con";
  title: string;
  claims: readonly VerifiedClaim[];
}) {
  const Icon = kind === "pro" ? Plus : Minus;
  const accent = kind === "pro" ? "text-positive" : "text-negative";
  const verified = claims.filter((c) => c.verified);

  return (
    <Card variant="sunken">
      <CardHeader>
        <CardTitle as="h5" className={`text-sm ${accent}`}>
          {title}
        </CardTitle>
      </CardHeader>

      <CardBody>
        {verified.length === 0 ? (
          <p className="text-xs text-fg-muted">
            이 상권은 확인된 지표가 적어 정리할 내용이 없습니다.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {verified.map((claim, i) => (
              <li key={i} className="flex items-start gap-2 text-xs leading-relaxed text-fg-body">
                <Icon aria-hidden="true" className={`mt-1 size-3 shrink-0 ${accent}`} />
                <span className="min-w-0">
                  {claim.claim_text}
                  {claim.corrected ? (
                    <Badge tone="caution" className="ml-1.5 align-middle">
                      수치 정정됨
                    </Badge>
                  ) : null}
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardBody>
    </Card>
  );
}
