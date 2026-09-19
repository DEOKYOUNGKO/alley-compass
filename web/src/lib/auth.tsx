import type { Session, User } from "@supabase/supabase-js";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

import { redirectErrorMessage } from "./authErrors";
import { authRedirect, supabase } from "./supabase";

/* ──────────────────────────────────────────────────────────────
 * 로그인 상태.
 *
 * Supabase 가 세션을 localStorage 에 보관하고 만료 전에 알아서 갱신한다.
 * 우리는 그 변화를 구독해 화면에 반영하고, access_token 을 API 호출에
 * 넘겨주기만 한다.
 *
 * status 는 4상태다.
 *   loading          앱을 연 직후 저장된 세션을 확인하는 짧은 순간. 이때 로그인
 *                    화면을 먼저 그리면 이미 로그인한 사용자가 매번 깜빡 보게 된다.
 *   recovery         비밀번호 재설정 링크로 들어온 상태. Supabase 는 이 링크로
 *                    세션을 만들어 주지만, 새 비밀번호를 정하기 전에 앱을 열어 주면
 *                    재설정이 끝나지 않은 채로 남는다.
 *   authenticated / unauthenticated
 * ────────────────────────────────────────────────────────────── */

export type AuthStatus = "loading" | "authenticated" | "recovery" | "unauthenticated";

interface AuthContextValue {
  status: AuthStatus;
  user: User | null;
  session: Session | null;
  /** 로그인 화면에 띄울 안내 — 세션 만료, 만료된 메일 링크 등. 없으면 null. */
  notice: string | null;
  clearNotice: () => void;
  /** reason 을 주면 로그인 화면이 왜 로그아웃됐는지 보여준다. */
  signOut: (reason?: string) => Promise<void>;
  /** 새 비밀번호를 저장했다 — 재설정 상태를 끝내고 앱으로 들어간다. */
  finishRecovery: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(!supabase);
  const [recovering, setRecovering] = useState(authRedirect.recovery);
  const [notice, setNotice] = useState<string | null>(() =>
    authRedirect.error
      ? redirectErrorMessage(authRedirect.error.code, authRedirect.error.description)
      : null,
  );

  useEffect(() => {
    if (!supabase) return;

    let cancelled = false;

    supabase.auth.getSession().then(({ data }) => {
      if (cancelled) return;
      setSession(data.session);
      setReady(true);
    });

    // 로그인·로그아웃·토큰 갱신·다른 탭에서의 변화를 전부 여기서 받는다
    const { data: subscription } = supabase.auth.onAuthStateChange((event, next) => {
      // PKCE 흐름에서는 URL 에 type=recovery 가 없어서 이 이벤트로만 알 수 있다
      if (event === "PASSWORD_RECOVERY") setRecovering(true);
      if (event === "SIGNED_OUT") setRecovering(false);
      setSession(next);
      setReady(true);
    });

    return () => {
      cancelled = true;
      subscription.subscription.unsubscribe();
    };
  }, []);

  const signOut = useCallback(async (reason?: string) => {
    setNotice(reason ?? null);
    const result = await supabase?.auth.signOut();

    // 네트워크 오류면 Supabase 가 저장된 세션을 지우지 않는다. 적어도 이 탭에서는
    // 로그인 화면으로 보내야 같은 실패를 반복하지 않는다.
    if (result?.error) {
      setSession(null);
      setRecovering(false);
    }
  }, []);

  const clearNotice = useCallback(() => setNotice(null), []);
  const finishRecovery = useCallback(() => setRecovering(false), []);

  const status: AuthStatus = !ready
    ? "loading"
    : !session
      ? "unauthenticated"
      : recovering
        ? "recovery"
        : "authenticated";

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      session,
      user: session?.user ?? null,
      notice,
      clearNotice,
      signOut,
      finishRecovery,
    }),
    [status, session, notice, clearNotice, signOut, finishRecovery],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth 는 AuthProvider 안에서만 쓸 수 있습니다.");
  return ctx;
}

/**
 * 현재 access_token. API 호출 직전에 부른다.
 *
 * 저장된 값을 들고 다니지 않고 매번 Supabase 에 묻는 이유: 토큰은 1시간이면
 * 만료되고 라이브러리가 백그라운드에서 갱신한다. 캐시해 두면 갱신된 줄 모르고
 * 만료된 토큰을 보내게 된다.
 */
export async function getAccessToken(): Promise<string | null> {
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

interface ProfileMeta {
  name?: string;
  full_name?: string;
  /** 카카오는 name 없이 nickname 만 줄 때가 있다 */
  nickname?: string;
  avatar_url?: string;
  picture?: string;
}

/** 사용자에게 보여줄 이름. 소셜 로그인이면 프로필 이름, 아니면 이메일 앞부분.
 *  db/schema_v1.1.sql 의 handle_new_user() 와 같은 순서로 찾는다. */
export function displayName(user: User | null): string {
  if (!user) return "";
  const meta = user.user_metadata as ProfileMeta | undefined;
  return (
    meta?.full_name || meta?.name || meta?.nickname || user.email?.split("@")[0] || "회원"
  );
}

/** 소셜 로그인 프로필 사진. 이메일 가입이면 null. */
export function avatarUrl(user: User | null): string | null {
  const meta = user?.user_metadata as ProfileMeta | undefined;
  return meta?.avatar_url || meta?.picture || null;
}
