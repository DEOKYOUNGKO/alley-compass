import * as RadixTooltip from "@radix-ui/react-tooltip";
import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

/** 앱 루트를 한 번 감싸야 툴팁들이 지연 시간을 공유한다. */
export function TooltipProvider({ children }: { children: ReactNode }) {
  return (
    <RadixTooltip.Provider delayDuration={250} skipDelayDuration={400}>
      {children}
    </RadixTooltip.Provider>
  );
}

export interface TooltipProps {
  content: ReactNode;
  children: ReactNode;
  side?: "top" | "right" | "bottom" | "left";
}

/**
 * 보조 설명 전용. 툴팁 안에만 있는 정보는 터치 기기와 스크린리더에서
 * 닿기 어려우므로, 없으면 이해가 안 되는 내용은 넣지 않는다.
 */
export function Tooltip({ content, children, side = "top" }: TooltipProps) {
  return (
    <RadixTooltip.Root>
      <RadixTooltip.Trigger asChild>{children}</RadixTooltip.Trigger>
      <RadixTooltip.Portal>
        <RadixTooltip.Content
          side={side}
          sideOffset={6}
          className={cn(
            "z-50 max-w-[16rem] rounded-md border border-border bg-surface-raised px-2.5 py-1.5",
            "text-2xs leading-relaxed text-fg-body shadow-sm",
            "data-[state=delayed-open]:animate-[pop-in_0.14s_var(--ease-out-quart)]",
          )}
        >
          {content}
          <RadixTooltip.Arrow className="fill-surface-raised" />
        </RadixTooltip.Content>
      </RadixTooltip.Portal>
    </RadixTooltip.Root>
  );
}
