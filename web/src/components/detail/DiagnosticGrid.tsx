import { scoreTone } from "@/lib/format";
import type { DiagnosticAreaOut } from "@/types/api";
import {
  Badge,
  Card,
  CardBody,
  CardDescription,
  CardHeader,
  CardNote,
  CardTitle,
  DataRow,
  Meter,
} from "@/components/ui";

/* ──────────────────────────────────────────────────────────────
 * 상권 진단 4영역. 값·백분위·"미보유" 판정 전부 backend/detail.py 가
 * 계산해 내려준 것이고 여기서는 그리기만 한다 — 백분위 정의를
 * verification_tools.percentile() 하나로 유지하기 위해서다.
 *
 * 데이터가 없는 영역(비용)은 회색으로 죽이지 않고 nodata 변형(점선)을 쓴다.
 * "비어 있음이 의도된 것"임을 보이는 자리다.
 * ────────────────────────────────────────────────────────────── */

const topLabel = (topPct: number) => `상위 ${Math.max(1, Math.round(topPct))}%`;

export function DiagnosticGrid({ areas }: { areas: readonly DiagnosticAreaOut[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {areas.map((area) => (
        <Card key={area.key} variant={area.available ? "outline" : "nodata"}>
          <CardHeader
            action={
              area.available && area.top_pct !== null ? (
                <Badge tone={scoreTone(area.score ?? 0)} mono>
                  {topLabel(area.top_pct)}
                </Badge>
              ) : (
                <Badge tone="nodata">데이터 미보유</Badge>
              )
            }
          >
            <CardTitle as="h5" className="text-sm">
              {area.label}
            </CardTitle>
            <CardDescription>{area.caption}</CardDescription>
          </CardHeader>

          <CardBody className="pb-3">
            {area.available && area.score !== null ? (
              <div className="mb-2.5 flex items-center gap-3">
                <span className="font-mono text-xl font-semibold tabular-nums text-fg">
                  {area.score}
                  <span className="ml-1 text-2xs font-normal text-fg-subtle">지수</span>
                </span>
                <Meter
                  value={area.score}
                  tone={scoreTone(area.score)}
                  label={`${area.label} 지수 ${area.score}`}
                  className="flex-1"
                />
              </div>
            ) : null}

            <div>
              {area.rows.map((row) => (
                <DataRow
                  key={row.label}
                  label={row.label}
                  value={row.value}
                  unverified={row.unverified}
                  rank={row.top === null ? undefined : topLabel(row.top)}
                />
              ))}
            </div>
          </CardBody>

          {area.note ? <CardNote>{area.note}</CardNote> : null}
        </Card>
      ))}
    </div>
  );
}
