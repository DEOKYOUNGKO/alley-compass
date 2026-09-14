/* ── 데이터 교체 지점 ────────────────────────────────────────────────
 *
 * 지금은 목업 상수를 그대로 돌려준다. 나중에 실데이터로 바꿀 때
 * 건드릴 파일은 여기 하나다. 화면 컴포넌트는 useDistricts()가
 * 어디서 데이터를 가져오는지 알지 못한다.
 *
 * 실데이터 전환 절차:
 *   1. alley_compass_etl 로 Supabase의 districts / business_types /
 *      district_features 를 채운다.
 *   2. npm i @supabase/supabase-js, .env.local 에 VITE_SUPABASE_URL /
 *      VITE_SUPABASE_ANON_KEY 를 넣는다 (anon key만. secret key는 절대 금지 —
 *      스키마에 공개 읽기 정책이 이미 걸려 있어 anon으로 조회된다).
 *   3. 아래 loadFromSupabase() 를 구현하고 USE_SUPABASE 를 켠다.
 *
 * 주의: district_features 의 한 행은 "상권 × 업종 × 분기"다. 이 화면이
 * 쓰는 모양은 "상권 1개 = 객체 1개"이므로, 선택된 업종·최신 분기로
 * 필터링한 뒤 toDistrictShape() 로 변환하는 단계가 필요하다.
 */

import { MOCK_DISTRICTS } from "./mockDistricts";

const USE_SUPABASE = false;

export function useDistricts() {
  if (USE_SUPABASE) {
    throw new Error("Supabase 연동은 아직 구현 전입니다. dataSource.js 주석 참고.");
  }
  return { districts: MOCK_DISTRICTS, isMock: true };
}
