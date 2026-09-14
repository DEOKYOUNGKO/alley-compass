# 골목 컴퍼스 웹 (React + Vite)

`docs/prototype-v0.html` 프로토타입을 React 앱으로 이식한 것이다. 디자인·차트·인터랙션은
동일하고, 데이터만 나중에 갈아끼울 수 있도록 구조를 분리했다.

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # dist/
npm run preview  # 빌드 결과 확인
```

## ⚠️ 지금 화면의 숫자는 전부 목업이다

상권 10곳·업종 5종이 `src/data/mockDistricts.js`에 상수로 박혀 있고, 점수·근거 문장·검증
로그도 임시 계산이다. 실제 분석 결과가 아니다. 화면 우상단의 `프로토타입 · 목업 데이터`
배지와 푸터 고지는 이 사실을 명시하기 위한 것이므로 실데이터 연결 전까지 지우지 않는다.

## 구조

```
src/
  data/
    dataSource.js       ← 데이터 교체 지점. 실데이터 전환 시 여기만 바꾼다
    mockDistricts.js    목업 상권 10곳 + 시간대 곡선
    businessTypes.js    업종 마스터 · 가중치 · 초기 조건
  lib/
    scoring.js          생존 안정성 Score + 개인화 Ranking (임시 휴리스틱)
    diagnostics.js      상권 진단 4영역 — 지수 + 서울 내 상위%
    stats.js            백분위 (verification_tools.py percentile()과 같은 정의)
    reasons.js          추천/반대 근거 문장 (→ Recommendation·Risk Agent 자리)
    verification.js     검증 로그 (→ verification_claims 조회로 대체될 자리)
    rich.js             근거 문장의 조각 배열 표현 + 평문 변환
    format.js           clamp / 숫자 포맷 / Score 색상
  components/
    TopBar · PersonaBanner · ConditionPanel · ConversationPanel
    MapCard · RankList · DetailDrawer · DiagnosticPanel · Bar · Rich · SiteFooter
    charts/  HoursChart · CompetitionChart · SalesChart · ClosureChart
  App.jsx               조건 state · 대화 로그 · 랭킹 계산 조립
```

조건(state)은 `App.jsx`가 단독으로 소유하고, 나머지는 전부 props를 받는 순수 컴포넌트다.
`lib/` 의 함수도 전역을 읽지 않고 `(상권, 조건)`만 받는다 — 백엔드로 옮기기 쉽도록.

## 경쟁강도는 "면적 밀도"가 아니라 "수요 대비 공급"이다

우리 데이터에는 상권 면적이 없어 `점포수/면적` 밀도를 만들 수 없다. 그래서 면적이
필요 없는 정의를 쓴다.

```
점포당 배후수요 = 배후수요 지수 / 동종업종 점포수
```

값이 클수록 점포 하나가 나눠 갖는 수요가 커서 경쟁이 여유롭다. 경쟁 점수는 이 값의
서울 골목상권 분포 내 백분위다.

**이 정의는 세 곳이 공유한다.** 한쪽만 바꾸면 화면의 숫자와 검증 Tool의 판정이
어긋나므로 함께 고쳐야 한다.

| 위치 | 구현 |
|---|---|
| ETL | `extra_features.demand_per_store` |
| 검증 Tool | `verification_tools.competition_density()` (`basis: "demand_per_store"`) |
| 웹 | `lib/scoring.js`의 `buildCompetitionContext()` |

## 근거 문장을 HTML 문자열로 쓰지 않는 이유

원본 프로토타입은 `"점포당 배후수요 <b>2.9</b>..."` 같은 HTML 문자열을 innerHTML로 꽂았다.
이 앱은 문장을 조각 배열로 표현하고 `<Rich/>`로 렌더한다.

```js
["동종업종 점포 23개 · 점포당 배후수요 ", b("2.9"), ", 서울 평균보다 15% 높음"]
```

`dangerouslySetInnerHTML`이 필요 없고, 랭킹 행의 pill처럼 평문만 필요한 곳은
`plain(parts)`로 같은 문장을 태그 없이 얻는다. 나중에 Agent가 생성한 문장을 받을 때도
이 형태를 유지하면 화면 코드는 그대로 둘 수 있다.

## 실데이터 연결 (다음 단계)

1. `alley_compass_etl`로 Supabase의 `districts` / `business_types` / `district_features`를 채운다.
2. `npm i @supabase/supabase-js`, `.env.local`에 `VITE_SUPABASE_URL`·`VITE_SUPABASE_ANON_KEY`.
   **anon key만 쓴다.** secret key는 프론트 번들에 절대 넣지 않는다 — 스키마에 공개 읽기
   정책(`Public can read district features` 등)이 이미 걸려 있어 anon으로 조회된다.
3. `src/data/dataSource.js`의 `loadFromSupabase()`를 구현하고 `USE_SUPABASE`를 켠다.

`district_features`의 한 행은 **상권 × 업종 × 분기**다. 이 화면이 기대하는 모양은
"상권 1개 = 객체 1개"이므로, 선택된 업종과 최신 분기로 필터링한 뒤 변환하는 단계가
`dataSource.js` 안에 필요하다.

이후 LightGBM 예측과 Claude 에이전트를 붙일 때는 API 키를 프론트에 둘 수 없으므로
FastAPI 백엔드가 필요해진다(PRD §9, §19).
