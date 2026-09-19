/* 골목 컴퍼스 백엔드(backend/) API 클라이언트.
 *
 * 프론트는 Supabase를 직접 읽지 않는다 — Claude 호출(과금 발생)이 필요한
 * 순간부터 API 키를 프론트 번들에 둘 수 없으므로 항상 FastAPI를 거쳐야
 * 하고, 랭킹 로직도 backend/scoring.py 한 곳에만 있어야 화면 숫자와
 * 검증 Tool의 판정이 어긋나지 않는다. 그래서 무료 조회(랭킹)까지도
 * 처음부터 이 파일 하나를 통해서만 부른다.
 *
 * 기본 주소는 로컬 개발 서버(http://localhost:8000). 배포 시
 * .env.local에 VITE_API_BASE_URL을 설정한다.
 */

const BASE_URL = (import.meta.env.VITE_API_BASE_URL || "http://localhost:8000").replace(/\/$/, "");

async function request(path, options = {}) {
  let res;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      headers: { "Content-Type": "application/json" },
      ...options,
    });
  } catch {
    throw new Error(`백엔드(${BASE_URL})에 연결할 수 없습니다. uvicorn이 켜져 있는지 확인하세요.`);
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || `API 오류 (HTTP ${res.status})`);
  }
  return res.json();
}

/** 업종 목록. [{business_code, business_name}] */
export function fetchBusinessTypes() {
  return request("/business-types");
}

/** PRD §16 개인화 Ranking. RankRequest -> RankResponse. */
export function fetchRank({ businessCode, budget, age, character, priority, topK = 20 }) {
  return request("/rank", {
    method: "POST",
    body: JSON.stringify({
      business_code: businessCode,
      budget,
      age,
      character,
      priority,
      top_k: topK,
    }),
  });
}

/** PRD §10 Recommendation/Risk/Verification. Claude 과금 발생. */
export function fetchAgents(districtCode, { businessCode, budget, estimatedDeposit, age, character, priority }) {
  return request(`/districts/${encodeURIComponent(districtCode)}/agents`, {
    method: "POST",
    body: JSON.stringify({
      business_code: businessCode,
      budget,
      estimated_deposit: estimatedDeposit,
      age,
      character,
      priority,
    }),
  });
}

export { BASE_URL };
