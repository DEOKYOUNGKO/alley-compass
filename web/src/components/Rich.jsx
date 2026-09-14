import { Fragment } from "react";

/** rich.js의 조각 배열을 렌더한다. 문자열은 그대로, b(...)는 <b>로. */
export default function Rich({ parts }) {
  return (
    <>
      {parts.map((p, i) =>
        typeof p === "string" ? (
          <Fragment key={i}>{p}</Fragment>
        ) : (
          <b key={i}>{p.bold}</b>
        )
      )}
    </>
  );
}
