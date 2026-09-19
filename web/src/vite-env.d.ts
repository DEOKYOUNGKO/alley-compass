/// <reference types="vite/client" />

/* 이 앱이 읽는 환경변수. 여기 적어 두면 오타가 편집기에서 잡히고,
 * .env.example 과 실제 사용처가 어긋나는 일도 줄어든다.
 *
 * ⚠️ VITE_ 로 시작하는 값은 전부 번들에 그대로 들어가 공개된다.
 * 비밀키(service_role, ANTHROPIC_API_KEY 등)는 절대 여기 두지 않는다. */
interface ImportMetaEnv {
  /** backend FastAPI 주소. 없으면 http://localhost:8000 */
  readonly VITE_API_BASE_URL?: string;
  /** Supabase 프로젝트 URL */
  readonly VITE_SUPABASE_URL?: string;
  /** Supabase anon key — 공개돼도 되는 값. 접근 통제는 RLS 가 한다. */
  readonly VITE_SUPABASE_ANON_KEY?: string;
  /** 대시보드에서 실제로 켠 소셜 로그인 목록. 예: "google,kakao" */
  readonly VITE_AUTH_PROVIDERS?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
