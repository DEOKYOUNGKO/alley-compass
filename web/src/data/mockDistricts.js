/* 목업 상권 데이터 (docs/prototype-v0.html 에서 이식).
 *
 * 실제 분석 결과가 아니라 화면 구조를 시연하기 위한 상수다.
 * Supabase 연결 시 이 파일 대신 district_features 조회 결과가 들어온다 —
 * 교체 지점은 dataSource.js 한 곳이다.
 *
 * mx / my 는 mapcard SVG(viewBox 0 0 100 62) 안의 좌표다.
 * 실제 위경도가 아니며, districts.latitude/longitude가 채워지면 그때 대체한다.
 */
export const MOCK_DISTRICTS = [
  { code: "3110001", name: "연남동 먹자골목", gu: "마포구", mx: 16, my: 24, foot20: 94, foot30: 78, resident: 41, worker: 38, transit: 82, facilities: 63, sat: 90, deposit: 8500, salesTrend: -8, closureTrend: 34, salesBase: 3200, hours: "nightlife", weekend: false, nightGap: false },
  { code: "3110006", name: "망원역 골목", gu: "마포구", mx: 12, my: 31, foot20: 86, foot30: 74, resident: 55, worker: 34, transit: 78, facilities: 52, sat: 80, deposit: 6200, salesTrend: -3, closureTrend: 26, salesBase: 2600, hours: "nightlife", weekend: false, nightGap: false },
  { code: "3120014", name: "문래동 예술촌 골목", gu: "영등포구", mx: 20, my: 45, foot20: 62, foot30: 70, resident: 48, worker: 66, transit: 78, facilities: 60, sat: 50, deposit: 3800, salesTrend: 16, closureTrend: 9, salesBase: 2100, hours: "mixed", weekend: false, nightGap: true },
  { code: "3130022", name: "공릉동 경춘선숲길", gu: "노원구", mx: 85, my: 13, foot20: 66, foot30: 58, resident: 70, worker: 30, transit: 60, facilities: 66, sat: 40, deposit: 2900, salesTrend: 6, closureTrend: 10, salesBase: 1900, hours: "residential", weekend: false, nightGap: true },
  { code: "3140008", name: "상도동 밤골목", gu: "동작구", mx: 34, my: 52, foot20: 40, foot30: 62, resident: 82, worker: 26, transit: 64, facilities: 54, sat: 38, deposit: 3200, salesTrend: 2, closureTrend: 8, salesBase: 2000, hours: "residential", weekend: false, nightGap: true },
  { code: "3150011", name: "샤로수길(서울대입구)", gu: "관악구", mx: 44, my: 58, foot20: 96, foot30: 64, resident: 60, worker: 40, transit: 86, facilities: 70, sat: 88, deposit: 5200, salesTrend: -6, closureTrend: 33, salesBase: 2800, hours: "nightlife", weekend: false, nightGap: false },
  { code: "3160003", name: "익선동 한옥골목", gu: "종로구", mx: 52, my: 27, foot20: 70, foot30: 66, resident: 30, worker: 58, transit: 88, facilities: 60, sat: 78, deposit: 9000, salesTrend: -4, closureTrend: 22, salesBase: 3000, hours: "nightlife", weekend: true, nightGap: false },
  { code: "3170009", name: "성수동 카페거리", gu: "성동구", mx: 66, my: 29, foot20: 82, foot30: 80, resident: 44, worker: 62, transit: 80, facilities: 66, sat: 84, deposit: 11000, salesTrend: 9, closureTrend: 18, salesBase: 3600, hours: "daytime", weekend: true, nightGap: false },
  { code: "3180005", name: "후암동 새길골목", gu: "용산구", mx: 48, my: 37, foot20: 33, foot30: 60, resident: 76, worker: 28, transit: 46, facilities: 40, sat: 30, deposit: 3000, salesTrend: 7, closureTrend: 7, salesBase: 1700, hours: "residential", weekend: false, nightGap: true },
  { code: "3190012", name: "방배 사이길", gu: "서초구", mx: 52, my: 50, foot20: 44, foot30: 72, resident: 74, worker: 36, transit: 58, facilities: 56, sat: 60, deposit: 7000, salesTrend: 3, closureTrend: 11, salesBase: 2500, hours: "daytime", weekend: false, nightGap: true },
];

/* 시간대별 유동인구 곡선 형태 (2시간 단위 12구간) */
export const SHAPES = {
  nightlife: [0.06, 0.03, 0.02, 0.05, 0.22, 0.4, 0.55, 0.62, 0.7, 0.85, 1.0, 0.78],
  residential: [0.1, 0.05, 0.04, 0.12, 0.34, 0.52, 0.6, 0.55, 0.58, 0.66, 0.48, 0.24],
  daytime: [0.05, 0.03, 0.03, 0.1, 0.4, 0.78, 1.0, 0.82, 0.74, 0.6, 0.34, 0.14],
  mixed: [0.07, 0.04, 0.03, 0.1, 0.38, 0.66, 0.8, 0.72, 0.78, 0.92, 0.82, 0.44],
};
