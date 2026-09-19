# 골목 컴퍼스 웹 (React + Vite)

`docs/prototype-v0.html` 프로토타입을 React로 이식한 뒤, `backend/` FastAPI에
연결했다. **랭킹·업종 목록은 실제 데이터**고, **추천/반대 근거는 실제
Claude 호출**이다(버튼을 눌러야 생성됨 — 아래 참고).

```bash
# 1) 백엔드 먼저 (다른 터미널)
cd ../backend && uvicorn main:app --reload --port 8000

# 2) 웹
npm install
npm run dev      # http://localhost:5173
npm run build    # dist/
```

기본으로 `http://localhost:8000`의 백엔드를 본다. 다른 주소를 쓰려면
`.env.example`을 `.env.local`로 복사해 `VITE_API_BASE_URL`을 바꾼다.

## ⚠️ 지금 화면에서 진짜인 것 / 아직 아닌 것

| | 상태 |
|---|---|
| 상권 목록·업종 목록 | ✅ 실제 (`GET /business-types`, `POST /rank`) — `alley_compass_etl.py`로 수집한 만큼만 나온다 |
| 생존 안정성 Score | ⚠️ 실제 feature 기반이지만 **LightGBM 아닌 휴리스틱**(`heuristic-v0`). 헤더에 모델 버전을 그대로 표시한다 |
| 추천/반대 근거 | ✅ 실제 Claude 호출(Recommendation/Risk/Verification Agent) — Drawer의 "생성하기" 버튼을 눌러야 부른다 (자동 호출 안 함 — 호출마다 과금 + 15~20초) |
| 지도 | ❌ 없음. 5종 데이터셋에 상권 위경도가 없어 Top 5 스트립으로 대체 (`MapCard.jsx`) |
| 상세 차트(시간대별 유동인구·분기별 매출 추세 등) | ❌ 없음. backend가 아직 시계열/세부 항목을 노출하지 않아 뺐다 — 지어내지 않는다 |

업종이 하나만 보이면(`alley_compass_etl.py`가 지금 "커피-음료"만 수집돼
있으면) 그게 정상이다 — 더 수집하면 드롭다운도 늘어난다.

## 구조

```
src/
  data/
    api.js              backend 호출 (fetchBusinessTypes/fetchRank/fetchAgents) — 데이터 접점은 여기 하나
    businessTypes.js     화면 문구용 라벨 + 초기 조건 (업종 목록 자체는 더 이상 여기 없음)
  lib/
    rich.js               대화 로그 문장의 조각 배열 표현
    format.js             clamp / 숫자 포맷 / Score 색상
  components/
    TopBar · PersonaBanner · ConditionPanel · ConversationPanel
    MapCard(Top5 스트립) · RankList · DetailDrawer · Bar · Rich · SiteFooter
  App.jsx                 조건 state · API 호출 · 대화 로그 조립
```

## 왜 프론트가 Supabase를 직접 안 읽는가

Claude 호출(추천/반대 근거)은 API 키가 필요한데, 그 키를 프론트 번들에
넣을 수 없다 — 그래서 애초에 랭킹까지도 전부 `backend/`를 거친다.
랭킹 로직도 `backend/scoring.py` 한 곳에만 있어야 화면 숫자와
`verification_tools.py`의 판정이 어긋나지 않는다.

## 근거 문장을 HTML 문자열로 쓰지 않는 이유

대화 로그(`ConversationPanel`)는 여전히 `["문장 ", b("굵게"), " 문장"]` 같은
조각 배열 + `<Rich/>`로 렌더한다. Claude가 만든 추천/반대 근거는 이미
검증까지 끝난 평문(`claim_text`)이라 그대로 `<li>{c.claim_text}</li>`로
렌더한다 — `dangerouslySetInnerHTML` 없음.

## 다음 단계

1. `alley_compass_etl.py`로 업종을 몇 개 더 수집(세탁소·편의점 등)하면
   드롭다운과 "업종 전환" 대화 칩이 덜 초라해진다.
2. `ml/train.py`로 LightGBM이 학습되면 `backend/scoring.py`의 Score 계산만
   바뀌고, 이 화면은 `model_version` 표시 문구 외엔 손댈 게 없다.
3. 상권 위경도(`districts.latitude/longitude`)가 채워지면 `MapCard.jsx`만
   실제 지도로 바꾸면 된다.
4. Drawer가 만든 추천/반대 근거를 `agent_analyses`/`verification_claims`에
   저장하려면 `backend/main.py`에 그 부분만 추가하면 된다(현재는 응답으로만
   나가고 저장 안 함).
