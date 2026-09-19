import { Monitor, Moon, Sun } from "lucide-react";

import { useTheme, type ThemePreference } from "@/lib/useTheme";
import { Button, Tooltip } from "@/components/ui";

const ICON = { system: Monitor, light: Sun, dark: Moon } as const;

const LABEL: Record<ThemePreference, string> = {
  system: "시스템 설정에 맞춤",
  light: "밝게",
  dark: "어둡게",
};

export function ThemeToggle() {
  const { preference, cycle } = useTheme();
  const Icon = ICON[preference];

  return (
    <Tooltip content={`화면 밝기 — ${LABEL[preference]}`}>
      <Button
        variant="ghost"
        size="icon"
        onClick={cycle}
        aria-label={`화면 밝기 전환 (현재: ${LABEL[preference]})`}
      >
        <Icon aria-hidden="true" className="size-4" />
      </Button>
    </Tooltip>
  );
}
