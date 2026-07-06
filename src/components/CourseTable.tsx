import type { Bucket, JudgedCourse } from '../lib/types'

const BUCKET_LABELS: Record<Bucket, string> = {
  'senko-kiso': '専攻基礎科目',
  'senko-kyokai': '専攻境界科目',
  'kodo-kyoyo': '高度教養教育科目',
  kokusai: '高度国際性涵養教育科目',
  unknown: '区分不明',
}

export function CourseTable({ courses }: { courses: JudgedCourse[] }) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>No.</th>
            <th>科目名</th>
            <th>科目小区分</th>
            <th>単位</th>
            <th>年度・学期</th>
            <th>評語</th>
            <th>合否</th>
            <th>充当先</th>
          </tr>
        </thead>
        <tbody>
          {courses.map((c) => (
            <tr key={c.no} className={c.passed ? '' : 'row-failed'}>
              <td className="num">{c.no}</td>
              <td>{c.name}</td>
              <td>{c.subCategory}</td>
              <td className="num">{c.credits}</td>
              <td>
                {c.year} {c.term}
              </td>
              <td>{c.grade}</td>
              <td>{c.passed ? '合' : '否'}</td>
              <td>{c.bucket ? BUCKET_LABELS[c.bucket] : '（不算入）'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
