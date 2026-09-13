# 골목 컴퍼스 ETL

## 1. 설치

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
```

`.env`에 다음 3개를 입력합니다.

- `SEOUL_API_KEY`
- `SUPABASE_URL`
- `SUPABASE_SECRET_KEY`

`SUPABASE_SECRET_KEY`는 서버 전용입니다. 프론트엔드에 넣지 않습니다.

---

## 2. 먼저 1분기 + 1업종으로 테스트

```bash
python alley_compass_etl.py \
  --start-quarter 20251 \
  --end-quarter 20251 \
  --business-name "커피-음료" \
  --no-upload
```

정상이라면 `data/processed/` 아래에 다음 파일이 생깁니다.

- `districts.csv`
- `business_types.csv`
- `district_features_debug.csv`

---

## 3. Supabase까지 실제 업로드

```bash
python alley_compass_etl.py \
  --start-quarter 20251 \
  --end-quarter 20251 \
  --business-name "커피-음료"
```

---

## 4. MVP 업종 여러 개

서울시 실제 업종명과 일치해야 합니다.

```bash
python alley_compass_etl.py \
  --start-quarter 20241 \
  --end-quarter 20252 \
  --business-name "커피-음료" \
  --business-name "세탁소" \
  --business-name "편의점" \
  --business-name "한식음식점" \
  --business-name "미용실"
```

업종명을 잘못 입력하면 스크립트가 사용 가능한 업종명 목록을 출력합니다.

---

## 5. 전체 업종

`--business-name`, `--business-code`를 모두 생략하면 전체 생활밀접업종을 처리합니다.

```bash
python alley_compass_etl.py \
  --start-quarter 20211 \
  --end-quarter 20252
```

주의: 데이터와 Supabase row 수가 크게 증가합니다. 대회 MVP에서는 필요한 업종부터 넣는 것을 권장합니다.

---

## 6. RAW를 다시 받고 싶을 때

```bash
python alley_compass_etl.py ... --refresh
```

기본값은 이미 받은 RAW CSV를 재사용합니다.

---

## 7. Verification Tools (PRD §11)

Recommendation/Risk Agent가 만든 문장을 원본 데이터와 대조하는 6개 Tool.
LLM을 쓰지 않고 전부 Pandas/통계 연산으로 판정한다 (PRD §10.3, §18).

```bash
# 로컬 CSV(district_features_debug.csv)로 데모 실행
python verification_tools.py

# 상권/업종 지정
python verification_tools.py --district-code 3120014 --business-code CS100010

# Supabase에 실제로 업로드된 데이터로 실행
python verification_tools.py --supabase
```

데모는 PRD §10.3의 "상위 8% → 검증 → 상위 약 10%로 정정" 흐름을 실제
데이터로 재현하고, 이어서 `verify_claim()` 배치 실행 예시를 보여준다.

| Tool | 함수 |
|---|---|
| Data Lookup Tool | `data_lookup()` |
| Percentile Tool | `percentile()` |
| Trend Calculator | `trend()` |
| Competition Density Tool | `competition_density()` |
| Budget Validator | `budget_validator()` |
| Assertion Validator | `assertion_validator()` |

`verify_claim(df, Claim(...))`이 위 6개를 `verification_type`에 따라
호출하는 통합 디스패처이고, `to_verification_claim_row()`는 결과를
`verification_claims` 테이블 insert용 행으로 변환한다 — 나중에
Recommendation/Risk/Verification 에이전트 체인을 붙일 때 그대로 쓰면 된다.

**Budget Validator에 대한 주의**: 5종 공식 데이터셋에는 보증금/임대료가
없다. 그래서 이 Tool은 "추정 보증금과 예산 비교의 산술이 맞는가"만
검증하고, 추정 보증금 자체가 데이터로 검증된 값이 아니라는 사실을
결과의 `note`에 항상 남긴다. 실측을 붙이려면 부동산원 상업용 부동산
임대조사를 상권_코드에 매핑하는 단계가 선행되어야 한다.

**Competition Density Tool의 판정 기준**: 면적이 없으므로 `점포당 배후수요`
(= (유동+상주+직장) / 점포수)로 비교한다. `ratio_to_avg`는 이 값의 서울 평균
대비 비율이며 **클수록 경쟁이 여유롭다** — 점포수 비율과 방향이 반대다.
배후수요 컬럼이 전부 비어 있으면 점포수 기준으로 물러서고, 어느 쪽으로
판정했는지는 결과의 `basis` 필드(`demand_per_store` / `store_count`)에 남는다.

---

## 현재 스키마와 관련된 의도적 NULL

### `competition_density`

5종 데이터에는 상권 면적이 없으므로 `점포수/면적` 같은 실제 밀도를 만들 수 없습니다.
따라서 이 컬럼(면적 기반 밀도를 뜻함)은 가짜 값을 넣지 않고 NULL로 둡니다.

대신 면적이 필요 없는 경쟁강도를 `extra_features`에 파생해 넣습니다.

```
backing_demand   = 유동인구 + 상주인구 + 직장인구
demand_per_store = backing_demand / store_count
```

값이 클수록 점포 하나가 나눠 갖는 수요가 커서 경쟁이 여유롭다는 뜻입니다.
`store_count`가 0이면 나누지 않고 NULL로 둡니다.

`verification_tools.competition_density()`와 웹 프론트(`web/src/lib/scoring.js`)가
같은 정의를 사용하므로, 화면에 보이는 경쟁강도와 검증 Tool의 판정 기준이 일치합니다.

### `districts.gu_name`, `latitude`, `longitude`

현재 5종 API의 상권 행에는 자치구/위경도가 포함되지 않습니다.
지도 기능을 붙일 때 `영역-상권` 데이터 또는 별도 geocoding 파이프라인으로 추가합니다.
