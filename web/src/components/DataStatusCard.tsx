import { AlertTriangle, MapPinOff } from "lucide-react";

import { fmt } from "@/lib/format";
import type { RankResponse } from "@/types/api";
import { Card, CardBody, CardHeader, CardTitle, DataRow } from "@/components/ui";

/* 분석 기준 — "이 순위가 무엇을 근거로 나왔는가".
 *
 * 원래 이 자리에는 지도가 있었다. 5종 공개 데이터셋에 상권 위경도가 없어
 * 좌표를 임의로 찍어 그린 그림이었는데, 지도는 "정확해 보이는" 표현이라
 * 근사라고 밝혀도 없는 정밀도를 있는 것처럼 읽히게 만든다. 그래서 걷어내고
 * 그 자리에 실제로 쓸모 있는 정보를 둔다. */

export interface DataStatusCardProps {
  meta: RankResponse | null;
}

export function DataStatusCard({ meta }: DataStatusCardProps) {
  return (
    <Card>
      <CardHeader divided>
        <CardTitle as="h3" className="text-sm">
          분석 기준
        </CardTitle>
      </CardHeader>

      <CardBody className="pt-3">
        <DataRow label="비교한 상권" value={meta ? `${fmt(meta.n_candidates)}곳` : "—"} />
        <DataRow label="데이터 기준" value={meta?.as_of ?? "—"} />
        <DataRow label="출처" value="서울 열린데이터광장" />

        {meta?.warnings.length ? (
          <ul className="mt-3 flex flex-col gap-1.5">
            {meta.warnings.map((warning) => (
              <li
                key={warning}
                className="flex items-start gap-2 rounded-md bg-caution-subtle px-2.5 py-1.5 text-2xs leading-relaxed text-caution-text"
              >
                <AlertTriangle aria-hidden="true" className="mt-0.5 size-3 shrink-0" />
                <span>{warning}</span>
              </li>
            ))}
          </ul>
        ) : null}

        <p className="mt-3 flex items-start gap-2 border-t border-border-subtle pt-3 text-2xs leading-relaxed text-fg-muted">
          <MapPinOff aria-hidden="true" className="mt-0.5 size-3 shrink-0" />
          <span>
            지도는 준비 중입니다. 공개 데이터에 상권 좌표가 없어, 위치를 짐작해 표시하는 대신
            비워 뒀습니다.
          </span>
        </p>
      </CardBody>
    </Card>
  );
}
