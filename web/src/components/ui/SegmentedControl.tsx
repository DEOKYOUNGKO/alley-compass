import * as ToggleGroup from "@radix-ui/react-toggle-group";

import { cn } from "@/lib/cn";

/* ──────────────────────────────────────────────────────────────
 * SegmentedControl — 서로 배타적인 3~4개 중 하나 고르기.
 *
 * 라디오 버튼 대신 쓰는 이유: 선택지가 짧고 개수가 적을 땐 전부 보이는 편이
 * 낫다. 드롭다운은 한 번 더 눌러야 내용을 볼 수 있다.
 *
 * Radix ToggleGroup 이 role="radiogroup" 과 화살표 키 이동을 붙여준다.
 * 직접 만들면 Tab 이 버튼 개수만큼 멈추는 흔한 실수를 하게 된다.
 * ────────────────────────────────────────────────────────────── */

export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
}

export interface SegmentedControlProps<T extends string> {
  options: readonly SegmentedOption<T>[];
  value: T;
  onValueChange: (value: T) => void;
  /** 컨트롤을 설명하는 라벨. Field 안에 있으면 FieldLabel 이 대신한다. */
  "aria-label"?: string;
  /** 3개 초과면 2줄로 흐르게 둔다 */
  wrap?: boolean;
  className?: string;
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onValueChange,
  wrap = false,
  className,
  ...rest
}: SegmentedControlProps<T>) {
  return (
    <ToggleGroup.Root
      type="single"
      value={value}
      // Radix 는 같은 항목을 다시 누르면 "" 를 준다. 배타 선택에서는
      // 빈 값이 있을 수 없으므로 무시한다.
      onValueChange={(next) => next && onValueChange(next as T)}
      className={cn(
        "grid gap-1 rounded-lg border border-border bg-surface-sunken p-1",
        wrap ? "grid-cols-2" : `grid-cols-${options.length}`,
        className,
      )}
      style={wrap ? undefined : { gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
      {...rest}
    >
      {options.map((option) => (
        <ToggleGroup.Item
          key={option.value}
          value={option.value}
          className={cn(
            "rounded-md px-2 py-1.5 text-xs font-medium text-fg-muted",
            "transition-[background-color,color] duration-150",
            "hover:text-fg",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/35",
            "data-[state=on]:bg-surface data-[state=on]:text-fg data-[state=on]:shadow-xs",
          )}
        >
          {option.label}
        </ToggleGroup.Item>
      ))}
    </ToggleGroup.Root>
  );
}
