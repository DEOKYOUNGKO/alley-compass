import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/* ──────────────────────────────────────────────────────────────
 * Supabase 클라이언트 — 로그인 전용으로 쓴다.
 *
 * 데이터 조회에는 쓰지 않는다. 상권 데이터는 FastAPI 를 거친다 —
 * 랭킹 로직이 backend/scoring.py 한 곳에만 있어야 하고, Claude 키를
 * 프론트 번들에 둘 수 없기 때문이다. 여기서 얻은 access_token 을
 * lib/api.ts 가 Authorization 헤더에 실어 보낸다.
 *
 * ⚠️ anon key 만 쓴다. service_role / secret key 는 번들에 절대 넣지 않는다.
 * anon key 는 공개돼도 되는 값이고, 실제 접근 통제는 Postgres RLS 가 한다.
 * ────────────────────────────────────────────────────────────── */

/** .env.example 을 복사만 하고 값을 안 바꾼 경우를 "미설정"으로 본다.
 *  그대로 두면 존재하지 않는 호스트로 요청이 나가 원인 모를 네트워크 오류가 된다. */
function envValue(raw: string | undefined): string | undefined {
  const value = raw?.trim();
  return value && !value.includes("YOUR_") ? value : undefined;
}

const url = envValue(import.meta.env.VITE_SUPABASE_URL);
const anonKey = envValue(import.meta.env.VITE_SUPABASE_ANON_KEY);

/* ── 메일 링크·소셜 로그인에서 돌아온 URL 읽기 ─────────────────
 *
 * 클라이언트를 만들기 전에 읽어야 한다. createClient 가 URL 의 토큰 조각을
 * 세션으로 바꾸면서 주소창을 지워 버리기 때문이다.
 *
 *   #...&type=recovery          비밀번호 재설정 링크 → 새 비밀번호 화면
 *   #error=...&error_code=...   만료된 링크, 소셜 로그인 취소 등 → 로그인 화면에 표시
 *
 * 오류 조각은 Supabase 가 지워 주지 않으므로 여기서 지운다. 남겨 두면
 * 새로고침할 때마다 같은 오류가 다시 뜬다. */

export interface AuthRedirect {
  /** 비밀번호 재설정 링크로 들어왔는가 */
  recovery: boolean;
  /** Supabase 가 URL 로 돌려준 오류. 없으면 null. */
  error: { code: string | null; description: string } | null;
}

function readAuthRedirect(): AuthRedirect {
  if (typeof window === "undefined") return { recovery: false, error: null };

  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  const query = new URLSearchParams(window.location.search);
  const pick = (key: string) => hash.get(key) ?? query.get(key);

  const recovery = pick("type") === "recovery";
  const description = pick("error_description");
  const error = description || pick("error")
    ? { code: pick("error_code") ?? pick("error"), description: description ?? "" }
    : null;

  if (error) {
    const clean = new URL(window.location.href);
    for (const key of ["error", "error_code", "error_description"]) clean.searchParams.delete(key);
    window.history.replaceState(null, "", `${clean.pathname}${clean.search}`);
  }

  return { recovery, error };
}

export const authRedirect: AuthRedirect = readAuthRedirect();

/**
 * 주소 끝에 남은 빈 `#` 을 지운다.
 *
 * Supabase 는 URL 의 토큰 조각을 세션으로 바꾼 뒤 `window.location.hash = ''` 로
 * 지우는데, 이 방식은 `http://localhost:5173/#` 처럼 `#` 한 글자를 남긴다.
 * 세션 처리가 끝난 뒤에 불러야 한다 — 먼저 지우면 토큰을 읽기 전에 사라진다.
 */
export function stripEmptyHash(): void {
  if (typeof window === "undefined") return;
  if (window.location.hash !== "" || !window.location.href.endsWith("#")) return;
  window.history.replaceState(window.history.state, "", `${window.location.pathname}${window.location.search}`);
}

/** 메일 링크·소셜 로그인이 돌아올 주소. Supabase 대시보드의
 *  Authentication → URL Configuration → Redirect URLs 에 등록돼 있어야 한다. */
export const AUTH_REDIRECT_URL =
  typeof window === "undefined" ? undefined : `${window.location.origin}/`;

/** 환경변수가 없으면 null. 화면이 "설정이 필요합니다"를 안내한다. */
export const supabase: SupabaseClient | null =
  url && anonKey
    ? createClient(url, anonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          // 소셜 로그인 후 돌아올 때 URL 의 토큰 조각을 세션으로 바꾼다
          detectSessionInUrl: true,
        },
      })
    : null;

export const isAuthConfigured = supabase !== null;

/** 대시보드에서 실제로 켠 provider 만 화면에 띄운다. */
export const enabledProviders: readonly ("google" | "kakao" | "github")[] = (
  import.meta.env.VITE_AUTH_PROVIDERS ?? ""
)
  .split(",")
  .map((p) => p.trim().toLowerCase())
  .filter((p): p is "google" | "kakao" | "github" =>
    p === "google" || p === "kakao" || p === "github",
  );
