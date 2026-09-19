import { AccountMenu } from "./auth/AccountMenu";
import { ThemeToggle } from "./ThemeToggle";

/* 상단 바 — 브랜드와 전역 상태만. 모델 지표·페르소나 설명은 여기 두지 않는다.
 * 첫 화면에서 가장 비싼 자리를 설명문이 차지하면 정작 결과가 접힌 아래로 밀린다. */

function CompassMark() {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className="size-7 text-accent">
      <circle cx="16" cy="16" r="13" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="M16 6 L19 15 L16 26 L13 15 Z" fill="currentColor" />
      <circle cx="16" cy="16" r="2" className="fill-surface" />
    </svg>
  );
}

export function AppHeader() {
  return (
    <header className="border-b border-border bg-surface">
      <div className="mx-auto flex max-w-[86rem] items-center gap-3 px-4 py-2.5 sm:px-6">
        <CompassMark />

        <div className="min-w-0">
          <p className="text-md font-semibold leading-tight text-fg">골목 컴퍼스</p>
          <p className="font-mono text-2xs uppercase tracking-[0.14em] text-fg-subtle">
            Alley Compass
          </p>
        </div>

        <div className="ml-auto flex items-center gap-1.5">
          <ThemeToggle />
          <span aria-hidden="true" className="h-4 w-px bg-border" />
          <AccountMenu />
        </div>
      </div>
    </header>
  );
}
