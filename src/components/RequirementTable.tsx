import type { RequirementResult } from '../lib/types'

function StatusBadge({ satisfied }: { satisfied: boolean | null }) {
  if (satisfied === null)
    return <span className="badge badge-info">要確認</span>
  return satisfied ? (
    <span className="badge badge-ok">充足</span>
  ) : (
    <span className="badge badge-ng">不足</span>
  )
}

export function RequirementTable({
  requirements,
}: {
  requirements: RequirementResult[]
}) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>要件</th>
            <th>判定</th>
            <th>修得 / 必要</th>
            <th>備考</th>
          </tr>
        </thead>
        <tbody>
          {requirements.map((r) => (
            <tr key={r.id}>
              <td>{r.label}</td>
              <td>
                <StatusBadge satisfied={r.satisfied} />
              </td>
              <td className="num">
                {r.current !== undefined && r.required !== undefined
                  ? `${r.current} / ${r.required}`
                  : '—'}
              </td>
              <td>{r.detail}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
