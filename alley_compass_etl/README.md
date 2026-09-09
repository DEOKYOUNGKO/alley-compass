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

## 현재 스키마와 관련된 의도적 NULL

### `competition_density`

현재 PRD의 5종 데이터에는 상권 면적이 없으므로 `점포수/면적` 같은 실제 밀도를 만들 수 없습니다.
따라서 가짜 밀도를 생성하지 않고 NULL로 둡니다. 현재 경쟁 feature는 `store_count`를 사용합니다.

### `districts.gu_name`, `latitude`, `longitude`

현재 5종 API의 상권 행에는 자치구/위경도가 포함되지 않습니다.
지도 기능을 붙일 때 `영역-상권` 데이터 또는 별도 geocoding 파이프라인으로 추가합니다.
