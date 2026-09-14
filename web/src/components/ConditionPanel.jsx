import { BIZ_OPTIONS } from "../data/businessTypes";
import { fmt } from "../lib/format";

/* 조건 입력 패널 (F-01) — 업종·예산·타깃 연령·상권 성격·우선순위.
 * 값을 직접 들고 있지 않는 controlled 컴포넌트다. 조건 state는 App이 소유한다. */

const SEG_GROUPS = [
  {
    id: "age",
    label: "타깃 연령",
    hint: "주 고객층",
    options: [
      { v: "20", label: "20대" },
      { v: "30", label: "30대" },
      { v: "both", label: "20–30대" },
    ],
  },
  {
    id: "character",
    label: "상권 성격",
    hint: "어떤 동네",
    options: [
      { v: "foot", label: "유동인구 중심" },
      { v: "resident", label: "주거 배후" },
      { v: "worker", label: "직장 배후" },
      { v: "campus", label: "대학가" },
    ],
  },
  {
    id: "priority",
    label: "우선순위",
    hint: "무엇을 먼저",
    options: [
      { v: "survival", label: "생존 안정성" },
      { v: "cost", label: "예산 적합성" },
      { v: "growth", label: "성장 가능성" },
    ],
  },
];

export default function ConditionPanel({ conditions, onBizChange, onBudgetChange, onSegChange }) {
  return (
    <section className="panel">
      <h2>A씨가 입력한 조건</h2>
      <div className="pad">
        <div className="field">
          <label htmlFor="biz">
            업종 <span className="hint">무엇을 열까</span>
          </label>
          <select
            className="biz"
            id="biz"
            value={conditions.biz}
            onChange={(e) => onBizChange(e.target.value)}
          >
            {BIZ_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label htmlFor="budget">
            보증금 예산 <span className="hint">초기자본 상한</span>
          </label>
          <div className="range">
            <input
              type="range"
              id="budget"
              min="1000"
              max="15000"
              step="500"
              value={conditions.budget}
              onChange={(e) => onBudgetChange(Number(e.target.value))}
            />
            <div className="rv">
              <span>{fmt(conditions.budget)}</span>
              <span className="unit"> 만원 이하</span>
            </div>
          </div>
        </div>

        {SEG_GROUPS.map((g) => (
          <div className="field" key={g.id}>
            <label>
              {g.label} <span className="hint">{g.hint}</span>
            </label>
            <div className="seg">
              {g.options.map((o) => (
                <button
                  key={o.v}
                  type="button"
                  aria-pressed={conditions[g.id] === o.v}
                  onClick={() => onSegChange(g.id, o.v, o.label, g.label)}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
