import { AlertTriangle, Compass, MailCheck } from "lucide-react";
import type { ReactNode } from "react";

import { Card, CardBody } from "@/components/ui";
import { cn } from "@/lib/cn";

import { ThemeToggle } from "../ThemeToggle";

/* ──────────────────────────────────────────────────────────────
 * 로그인 계열 화면의 공통 틀 — 로그인/가입/재설정, 새 비밀번호.
 *
 * 왼쪽은 "여기가 무엇을 해주는 곳인가", 오른쪽은 입력. 로그인이 필수인
 * 서비스에서 폼만 덩그러니 띄우면, 처음 온 사람은 무엇에 가입하는지 모른 채
 * 이메일을 적어야 한다.
 * ────────────────────────────────────────────────────────────── */

export function AuthLayout({
  title,
  description,
  children,
}: {
  title: string;
  description: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-bg">
      <header className="flex items-center justify-end px-4 py-3 sm:px-6">
        <ThemeToggle />
      </header>

      <main className="mx-auto grid w-full max-w-5xl flex-1 items-center gap-10 px-4 pb-16 sm:px-6 lg:grid-cols-2 lg:gap-16">
        <IntroPanel />

        <Card variant="raised" className="w-full max-w-md justify-self-center lg:justify-self-end">
          <CardBody className="pt-6">
            <h2 className="text-lg font-semibold text-fg">{title}</h2>
            <p className="mt-1 text-xs text-fg-muted">{description}</p>
            {children}
          </CardBody>
        </Card>
      </main>

      <footer className="px-4 pb-6 text-center sm:px-6">
        <p className="text-2xs text-fg-subtle">
          데이터 출처 · 서울 열린데이터광장「우리마을가게 상권분석서비스」 · 공공누리 제1유형
          {" · "}
          <a href="/privacy" className="underline underline-offset-2 hover:text-fg-muted">
            개인정보처리방침
          </a>
        </p>
      </footer>
    </div>
  );
}

/** 폼 안의 오류(negative)·완료 안내(positive) 상자. */
export function AuthAlert({
  tone,
  children,
  className,
}: {
  tone: "error" | "success";
  children: ReactNode;
  className?: string;
}) {
  const Icon = tone === "error" ? AlertTriangle : MailCheck;

  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={cn(
        "flex items-start gap-2 rounded-md px-3 py-2 text-xs leading-relaxed",
        tone === "error"
          ? "bg-negative-subtle text-negative-text"
          : "bg-positive-subtle text-positive-text",
        className,
      )}
    >
      <Icon aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" />
      <div className="min-w-0">{children}</div>
    </div>
  );
}

/* ── 왼쪽: 이 서비스가 무엇인가 ────────────────────────────── */

const POINTS = [
  {
    title: "장소를 먼저 고르지 않아도 됩니다",
    body: "업종·예산·타깃만 정하면 서울 골목상권 전체에서 조건에 맞는 곳을 찾아 드립니다.",
  },
  {
    title: "추천 이유와 주의할 점을 함께",
    body: "좋은 점만 모아 보여주지 않습니다. 이 자리의 약점도 같은 비중으로 정리합니다.",
  },
  {
    title: "숫자는 원본 데이터와 대조합니다",
    body: "설명에 들어간 수치를 공개 데이터와 하나씩 맞춰 보고, 어긋나면 보여 드리지 않습니다.",
  },
];

function IntroPanel() {
  return (
    <section className="max-w-md">
      <div className="flex items-center gap-2.5">
        <Compass aria-hidden="true" className="size-7 text-accent" />
        <div>
          <p className="text-md font-semibold leading-tight text-fg">골목 컴퍼스</p>
          <p className="font-mono text-2xs uppercase tracking-[0.14em] text-fg-subtle">
            Alley Compass
          </p>
        </div>
      </div>

      <h1 className="mt-6 text-3xl font-semibold leading-tight text-fg">
        어디에 열지부터
        <br />
        정하지 못했다면
      </h1>

      <p className="mt-3 text-sm leading-relaxed text-fg-body">
        서울 골목상권을 조건에 맞춰 비교하고, 살아남을 가능성이 높은 자리를 좁혀 드립니다.
      </p>

      <ul className="mt-7 flex flex-col gap-4">
        {POINTS.map((point) => (
          <li key={point.title} className="border-l-2 border-accent-border pl-3">
            <p className="text-xs font-semibold text-fg">{point.title}</p>
            <p className="mt-0.5 text-xs leading-relaxed text-fg-muted">{point.body}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
