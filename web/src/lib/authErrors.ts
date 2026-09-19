/* Supabase Auth 가 주는 영어 메시지를 사용자가 읽을 수 있는 문장으로 바꾼다.
 *
 * 로그인·가입·재설정·새 비밀번호·URL 로 돌아온 오류가 전부 여기를 지난다.
 * 모르는 메시지는 원문을 그대로 보여준다 — 뭉뚱그린 "오류가 발생했습니다"보다
 * 영어라도 원인이 보이는 편이 낫다. */

export const MIN_PASSWORD_LENGTH = 8;

/** URL 로 돌아온 오류(error_code)를 문장으로 */
export function redirectErrorMessage(code: string | null, description: string): string {
  if (code === "otp_expired") return "링크가 만료됐거나 이미 사용됐습니다. 메일을 다시 받아 주세요.";
  if (code === "access_denied" && !description) return "로그인이 취소됐습니다.";
  return authErrorMessage(description || "로그인하지 못했습니다. 다시 시도해 주세요.");
}

export function authErrorMessage(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("invalid login credentials")) return "이메일 또는 비밀번호가 맞지 않습니다.";
  if (m.includes("email not confirmed")) return "메일함에서 가입 확인 링크를 먼저 눌러 주세요.";
  if (m.includes("user already registered")) return "이미 가입된 이메일입니다. 로그인해 주세요.";
  if (m.includes("should be different from the old password"))
    return "지금 쓰는 비밀번호와 다른 비밀번호를 정해 주세요.";
  if (m.includes("password should be at least") || m.includes("weak password"))
    return `비밀번호는 ${MIN_PASSWORD_LENGTH}자 이상이어야 합니다.`;
  if (m.includes("unable to validate email address") || m.includes("invalid email"))
    return "이메일 형식을 확인해 주세요.";
  if (m.includes("rate limit") || m.includes("too many") || m.includes("for security purposes"))
    return "요청이 너무 잦습니다. 잠시 후 다시 시도해 주세요.";
  if (m.includes("provider is not enabled")) return "이 소셜 로그인은 아직 사용할 수 없습니다.";
  if (m.includes("email link is invalid or has expired"))
    return "링크가 만료됐거나 이미 사용됐습니다. 메일을 다시 받아 주세요.";
  if (m.includes("failed to fetch") || m.includes("networkerror"))
    return "로그인 서버에 연결할 수 없습니다. 네트워크와 VITE_SUPABASE_URL 을 확인해 주세요.";
  return message;
}
