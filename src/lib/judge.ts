/**
 * 修了要件の判定ロジック（純粋関数）。
 * 要件の根拠と判定仕様は docs/requirements.md を参照。
 */
import { normalizeCourseName } from './normalize'
import {
  ELECTIVE_REQUIRED_GROUPS,
  KODO_KYOYO_MIN,
  KOKUSAI_MIN,
  REQUIRED_COURSES,
  SENKO_KISO_MIN,
  SENMON_MIN,
  TOTAL_MIN,
} from './rules'
import type {
  Bucket,
  CourseRecord,
  JudgeResult,
  JudgedCourse,
  RequirementResult,
} from './types'

/**
 * 二重区分（専門教育科目・高度国際性涵養教育科目）の充当規則:
 * 高度国際性涵養教育科目に優先して充当する。ただし必要修得単位（1単位）を
 * 既に充足している場合は専門教育科目の単位に充当する（規程 別表1 (注)）。
 * 充当は科目単位で行う。
 */
function allocateBuckets(courses: CourseRecord[]): JudgedCourse[] {
  // 二重区分でない高度国際性涵養科目の合格単位を先に集計する
  let kokusaiUnits = courses
    .filter((c) => c.passed && c.category === 'kokusai')
    .reduce((sum, c) => sum + c.credits, 0)

  return courses.map((c): JudgedCourse => {
    if (!c.passed) return { ...c, bucket: null }
    let bucket: Bucket
    switch (c.category) {
      case 'senko-kiso-required':
      case 'senko-kiso-elective-required':
      case 'senko-kiso-elective':
        bucket = 'senko-kiso'
        break
      case 'senko-kyokai':
        bucket = 'senko-kyokai'
        break
      case 'kodo-kyoyo':
        bucket = 'kodo-kyoyo'
        break
      case 'kokusai':
        bucket = 'kokusai'
        break
      case 'dual':
        if (kokusaiUnits < KOKUSAI_MIN) {
          bucket = 'kokusai'
          kokusaiUnits += c.credits
        } else {
          // 専門教育科目側へ。専攻基礎/専攻境界は科目小区分に従う
          bucket = c.subCategory.includes('専攻境界')
            ? 'senko-kyokai'
            : 'senko-kiso'
        }
        break
      case 'unknown':
        bucket = 'unknown'
        break
    }
    return { ...c, bucket }
  })
}

function sumCredits(courses: JudgedCourse[], bucket: Bucket): number {
  return courses
    .filter((c) => c.bucket === bucket)
    .reduce((sum, c) => sum + c.credits, 0)
}

export function judge(courses: CourseRecord[]): JudgeResult {
  const warnings: string[] = []
  const judged = allocateBuckets(courses)
  const passedNames = new Set(
    judged.filter((c) => c.passed).map((c) => normalizeCourseName(c.name)),
  )

  // 1. 必修科目
  const missingRequired = REQUIRED_COURSES.filter((n) => !passedNames.has(n))
  const requiredOk = missingRequired.length === 0

  // 2. 選択必修（いずれかのグループを完全修得）
  const electiveOk = ELECTIVE_REQUIRED_GROUPS.some((group) =>
    group.every((n) => passedNames.has(n)),
  )

  // 3〜7. 単位数要件
  const senkoKiso = sumCredits(judged, 'senko-kiso')
  const senkoKyokai = sumCredits(judged, 'senko-kyokai')
  const kodoKyoyo = sumCredits(judged, 'kodo-kyoyo')
  const kokusai = sumCredits(judged, 'kokusai')
  const unknown = sumCredits(judged, 'unknown')
  const senmon = senkoKiso + senkoKyokai
  const total = senmon + kodoKyoyo + kokusai + unknown

  if (unknown > 0) {
    warnings.push(
      `区分を判定できない科目が ${unknown} 単位あります。総単位数には算入していますが、` +
        '「本専攻が指定する科目」に該当するかは教務係に確認してください。',
    )
  }
  const requirements: RequirementResult[] = [
    {
      id: 'required',
      label: '必修科目の修得',
      satisfied: requiredOk,
      detail: requiredOk
        ? 'コンピュータサイエンス研究Ⅰa・Ⅰb を修得済み'
        : `未修得の必修科目: ${missingRequired.join('、')}`,
    },
    {
      id: 'elective-required',
      label: '選択必修（演習Ⅰ・Ⅱ または 基礎演習A から4単位）',
      satisfied: electiveOk,
      detail: electiveOk
        ? '選択必修グループを修得済み'
        : '「コンピュータサイエンス演習Ⅰ及びⅡ」または「インタラクティブ創成工学基礎演習A」を修得してください',
    },
    {
      id: 'senko-kiso',
      label: '専攻基礎科目 22単位以上',
      satisfied: senkoKiso >= SENKO_KISO_MIN,
      current: senkoKiso,
      required: SENKO_KISO_MIN,
      detail:
        senkoKiso >= SENKO_KISO_MIN
          ? '充足'
          : `あと ${SENKO_KISO_MIN - senkoKiso} 単位必要`,
    },
    {
      id: 'senmon',
      label: '専門教育科目 22単位以上',
      satisfied: senmon >= SENMON_MIN,
      current: senmon,
      required: SENMON_MIN,
      detail:
        senmon >= SENMON_MIN ? '充足' : `あと ${SENMON_MIN - senmon} 単位必要`,
    },
    {
      id: 'kokusai',
      label: '高度国際性涵養教育科目 1単位以上',
      satisfied: kokusai >= KOKUSAI_MIN,
      current: kokusai,
      required: KOKUSAI_MIN,
      detail:
        kokusai >= KOKUSAI_MIN
          ? '充足'
          : `あと ${KOKUSAI_MIN - kokusai} 単位必要`,
    },
    {
      id: 'kodo-kyoyo',
      label: '高度教養教育科目 2単位以上',
      satisfied: kodoKyoyo >= KODO_KYOYO_MIN,
      current: kodoKyoyo,
      required: KODO_KYOYO_MIN,
      detail:
        kodoKyoyo >= KODO_KYOYO_MIN
          ? '充足'
          : `あと ${KODO_KYOYO_MIN - kodoKyoyo} 単位必要`,
    },
    {
      id: 'total',
      label: '総修得単位 30単位以上',
      satisfied: total >= TOTAL_MIN,
      current: total,
      required: TOTAL_MIN,
      detail:
        total >= TOTAL_MIN ? '充足' : `あと ${TOTAL_MIN - total} 単位必要`,
    },
    {
      id: 'research-guidance',
      label: '研究指導（別に定めるもの）',
      satisfied: null,
      detail: '成績 CSV からは判定できません。指導教員・教務係に確認してください。',
    },
  ]

  const overall = requirements
    .filter((r) => r.satisfied !== null)
    .every((r) => r.satisfied === true)

  return { overall, requirements, courses: judged, warnings }
}
