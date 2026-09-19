import { Loader2 } from "lucide-react";
import { useState, type FormEvent } from "react";

import { Button, Field, FieldHint, FieldLabel } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { authErrorMessage, MIN_PASSWORD_LENGTH } from "@/lib/authErrors";
import { supabase } from "@/lib/supabase";

import { AuthAlert, AuthLayout } from "./AuthLayout";
import { PasswordInput } from "./PasswordInput";

/* ──────────────────────────────────────────────────────────────
 * 새 비밀번호 — 재설정 메일의 링크를 누르고 돌아온 사용자.
 *
 * 이 시점엔 이미 세션이 있다(링크가 로그인시켜 준다). 그래도 앱을 바로 열지
 * 않고 여기서 멈추는 이유: 비밀번호를 잊어서 재설정을 요청한 사람이 새
 * 비밀번호를 정하지 않고 앱으로 들어가 버리면, 다음 로그인 때 또 막힌다.
 *
 * 확인 입력칸을 두는 이유: 비밀번호를 잊은 사람이 방금 오타 낸 비밀번호로
 * 바꾸면 재설정을 한 번 더 해야 한다.
 * ────────────────────────────────────────────────────────────── */

export function UpdatePasswordScreen() {
  const { user, finishRecovery, signOut } = useAuth();

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mismatch = confirm.length > 0 && password !== confirm;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!supabase || busy) return;

    if (password !== confirm) {
      setError("두 비밀번호가 서로 다릅니다.");
      return;
    }

    setBusy(true);
    setError(null);

    const { error: err } = await supabase.auth.updateUser({ password });
    setBusy(false);

    if (err) {
      setError(authErrorMessage(err.message));
      return;
    }
    finishRecovery();
  };

  return (
    <AuthLayout
      title="새 비밀번호 정하기"
      description={
        user?.email ? (
          <>
            <span className="font-medium text-fg-body">{user.email}</span> 계정의 비밀번호를
            바꿉니다.
          </>
        ) : (
          "새로 쓸 비밀번호를 입력해 주세요."
        )
      }
    >
      <form onSubmit={submit} className="mt-5 flex flex-col gap-4">
        {/* 비밀번호 관리자가 어느 계정의 비밀번호인지 알 수 있게 이메일을 같이 둔다 */}
        <input
          type="email"
          name="email"
          autoComplete="username"
          value={user?.email ?? ""}
          readOnly
          hidden
        />

        <Field hint>
          <FieldLabel>새 비밀번호</FieldLabel>
          <PasswordInput
            name="new-password"
            autoComplete="new-password"
            required
            minLength={MIN_PASSWORD_LENGTH}
            autoFocus
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={`${MIN_PASSWORD_LENGTH}자 이상`}
          />
          <FieldHint>{MIN_PASSWORD_LENGTH}자 이상으로 지어 주세요.</FieldHint>
        </Field>

        <Field error={mismatch ? "두 비밀번호가 서로 다릅니다." : undefined}>
          <FieldLabel>새 비밀번호 확인</FieldLabel>
          <PasswordInput
            name="confirm-password"
            autoComplete="new-password"
            required
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
        </Field>

        {error ? <AuthAlert tone="error">{error}</AuthAlert> : null}

        <Button type="submit" variant="solid" size="lg" disabled={busy || mismatch}>
          {busy ? <Loader2 aria-hidden="true" className="size-4 animate-spin" /> : null}
          비밀번호 바꾸고 시작하기
        </Button>
      </form>

      <p className="mt-5 border-t border-border-subtle pt-4 text-center text-xs text-fg-muted">
        재설정을 요청하지 않으셨나요?{" "}
        <button
          type="button"
          onClick={() => void signOut()}
          className="font-medium text-accent-text hover:underline"
        >
          취소하고 로그아웃
        </button>
      </p>
    </AuthLayout>
  );
}
