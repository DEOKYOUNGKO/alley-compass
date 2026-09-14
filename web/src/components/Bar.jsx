import { clamp } from "../lib/format";

/**
 * 가로 막대 한 줄.
 * @param width 0~100 (%)
 * @param value 우측에 표시할 텍스트
 * @param tone  "pos" | "neg" | undefined (기여도 부호 표시용)
 */
export default function Bar({ label, width, value, tone }) {
  return (
    <div className="bar">
      <span>{label}</span>
      <span className="track">
        <i className={tone || ""} style={{ width: `${clamp(width, 0, 100).toFixed(0)}%` }} />
      </span>
      <span className="val">{value}</span>
    </div>
  );
}
