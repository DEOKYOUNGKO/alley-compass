import { RotateCcw } from "lucide-react";
import { useEffect, useState } from "react";

import {
  AGE_OPTIONS,
  BUDGET_RANGE,
  CHARACTER_OPTIONS,
  PRIORITY_OPTIONS,
} from "@/data/businessTypes";
import { clamp, fmt } from "@/lib/format";
import type { AgeTarget, Conditions, MarketCharacter, Priority } from "@/types/domain";
import {
  Button,
  Field,
  FieldLabel,
  Input,
  SegmentedControl,
  Select,
  Slider,
  type SelectOption,
} from "@/components/ui";

/* ──────────────────────────────────────────────────────────────
 * 조건 입력 (F-01) — 이 서비스의 주된 인터랙션이다.
 *
 * 이전 화면은 이 컨트롤들을 좁은 왼쪽 사이드바에 세로로 쌓아 뒀다.
 * 조건을 바꾸는 것이 핵심 동작인데 결과와 멀리 떨어져 있었고, 화면 폭도
 * 좁아 라벨이 잘렸다. 결과 바로 위 가로 띠로 올리고 sticky 로 고정한다 —
 * 목록을 스크롤하면서도 조건을 계속 만질 수 있어야 한다.
 *
 * 값을 직접 들고 있지 않은 controlled 컴포넌트다. 조건 state 는 App 이 소유한다.
 * ────────────────────────────────────────────────────────────── */

export interface ConditionBarProps {
  conditions: Conditions;
  /** backend GET /business-types 결과. 실제로 수집된 업종만 들어 있다. */
  bizOptions: readonly SelectOption[];
  onBizChange: (value: string) => void;
  onBudgetChange: (value: number) => void;
  onAgeChange: (value: AgeTarget) => void;
  onCharacterChange: (value: MarketCharacter) => void;
  onPriorityChange: (value: Priority) => void;
  onReset: () => void;
}

export function ConditionBar({
  conditions,
  bizOptions,
  onBizChange,
  onBudgetChange,
  onAgeChange,
  onCharacterChange,
  onPriorityChange,
  onReset,
}: ConditionBarProps) {
  return (
    <div className="sticky top-0 z-30 border-b border-border bg-surface/95 backdrop-blur">
      <div className="mx-auto max-w-[86rem] px-4 py-3 sm:px-6">
        <div className="grid gap-x-5 gap-y-3.5 lg:grid-cols-12">
          <Field className="lg:col-span-2">
            <FieldLabel hint="무엇을 열까">업종</FieldLabel>
            <Select
              options={bizOptions}
              value={conditions.biz}
              onValueChange={onBizChange}
              placeholder={bizOptions.length ? "업종 선택" : "수집된 업종 없음"}
              aria-label="업종"
            />
          </Field>

          <BudgetField value={conditions.budget} onChange={onBudgetChange} />

          <Field className="lg:col-span-2">
            <FieldLabel hint="주 고객층">타깃 연령</FieldLabel>
            <SegmentedControl
              options={AGE_OPTIONS}
              value={conditions.age}
              onValueChange={onAgeChange}
              aria-label="타깃 연령"
            />
          </Field>

          <Field className="lg:col-span-2">
            <FieldLabel hint="어떤 동네">상권 성격</FieldLabel>
            <SegmentedControl
              options={CHARACTER_OPTIONS}
              value={conditions.character}
              onValueChange={onCharacterChange}
              aria-label="상권 성격"
              wrap
            />
          </Field>

          <Field className="lg:col-span-2">
            <FieldLabel hint="무엇을 먼저">우선순위</FieldLabel>
            <SegmentedControl
              options={PRIORITY_OPTIONS}
              value={conditions.priority}
              onValueChange={onPriorityChange}
              aria-label="우선순위"
              wrap
            />
          </Field>

          <div className="flex items-end lg:col-span-1">
            <Button variant="ghost" size="sm" onClick={onReset} className="w-full lg:w-auto">
              <RotateCcw aria-hidden="true" className="size-3.5" />
              초기화
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── 예산 — 슬라이더로 훑고, 숫자로 확정한다 ────────────────────
 * 슬라이더만 두면 5,000 과 5,500 을 손으로 집기 어렵고,
 * 숫자칸만 두면 "대충 어느 구간인지" 감이 오지 않는다. 둘 다 둔다. */

function BudgetField({ value, onChange }: { value: number; onChange: (value: number) => void }) {
  // 타이핑 도중의 "5" "50" 같은 중간 상태를 허용하려면 로컬 문자열이 필요하다.
  const [draft, setDraft] = useState(String(value));

  useEffect(() => setDraft(String(value)), [value]);

  const commit = () => {
    const parsed = Number(draft.replace(/[^0-9]/g, ""));
    const next = Number.isFinite(parsed) && parsed > 0
      ? clamp(Math.round(parsed / BUDGET_RANGE.step) * BUDGET_RANGE.step, BUDGET_RANGE.min, BUDGET_RANGE.max)
      : value;
    setDraft(String(next));
    if (next !== value) onChange(next);
  };

  return (
    <Field className="lg:col-span-3" hint>
      <FieldLabel hint="초기자본 상한">보증금 예산</FieldLabel>

      <div className="flex items-center gap-3">
        <Slider
          value={value}
          onValueChange={onChange}
          min={BUDGET_RANGE.min}
          max={BUDGET_RANGE.max}
          step={BUDGET_RANGE.step}
          aria-label="보증금 예산 (만원)"
          className="flex-1"
        />
        <Input
          size="sm"
          numeric
          inputMode="numeric"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
          suffix="만원"
          aria-label="보증금 예산 직접 입력 (만원)"
          wrapperClassName="w-32 shrink-0"
        />
      </div>

      <p className="text-2xs text-fg-subtle">
        {fmt(BUDGET_RANGE.min)}~{fmt(BUDGET_RANGE.max)}만원 · 현재 {fmt(value)}만원 이하
      </p>
    </Field>
  );
}
