import { useCallback, useEffect, useState } from "react";

/* ──────────────────────────────────────────────────────────────
 * 테마는 세 상태다 — "system" 이 기본이다.
 *
 *   system  아무것도 표시하지 않는다. OS 설정(prefers-color-scheme)을 따른다.
 *   light   data-theme="light" 를 박는다. OS 가 다크여도 라이트로 본다.
 *   dark    data-theme="dark"
 *
 * 라이트/다크 둘만 두면 "OS 따라가기"로 돌아갈 방법이 사라진다.
 * 토큰 쪽(tokens.semantic.css)이 이 세 상태를 전부 고려해 작성돼 있다.
 * ────────────────────────────────────────────────────────────── */

export type ThemePreference = "system" | "light" | "dark";

const STORAGE_KEY = "alley-compass:theme";

function readStored(): ThemePreference {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    if (value === "light" || value === "dark" || value === "system") return value;
  } catch {
    // 시크릿 모드 등에서 접근이 막힐 수 있다. 기본값으로 조용히 넘어간다.
  }
  return "system";
}

function apply(preference: ThemePreference): void {
  const root = document.documentElement;
  if (preference === "system") root.removeAttribute("data-theme");
  else root.setAttribute("data-theme", preference);
}

export function useTheme() {
  const [preference, setPreference] = useState<ThemePreference>(readStored);

  useEffect(() => {
    apply(preference);
    try {
      localStorage.setItem(STORAGE_KEY, preference);
    } catch {
      // 저장에 실패해도 이번 세션 동작에는 영향이 없다.
    }
  }, [preference]);

  /** system → light → dark → system 순환 */
  const cycle = useCallback(() => {
    setPreference((current) =>
      current === "system" ? "light" : current === "light" ? "dark" : "system",
    );
  }, []);

  return { preference, setPreference, cycle };
}
