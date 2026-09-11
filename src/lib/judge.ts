/**
 * 修了要件の判定ロジック（純粋関数）。
 * 要件の根拠と判定仕様は docs/requirements.md を参照。
 * 適用する要件は入学年度から選んだルールセット（rules.ts）で決まる。
 */
import { normalizeCourseName } from './normalize'
import { type RuleSet, ruleSetForEntryYear } from './rules'
import type {
  Bucket,
  CourseRecord,
  JudgedCourse,
  JudgeResult,
  RequirementResult,
} from './types'

export interface JudgeOptions {
  /** CSV にない指定科目を修得済みとして、その単位も算入する */
  assumeDesignatedCoursesPassed?: boolean
}

/**
 * 二重区分（専門教育科目・高度国際性涵養教育科目）の充当規則:
 * 高度国際性涵養教育科目に優先して充当する。ただし必要修得単位を
 * 既に充足している場合は専門教育科目の単位に充当する（規程 別表1 (注)）。
 * 充当は科目単位で行う。
 */
function allocateBuckets(
  courses: CourseRecord[],
  rules: RuleSet,
): JudgedCourse[] {
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
        if (kokusaiUnits < rules.kokusaiMin) {
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

export function judge(
  courses: CourseRecord[],
  entryYear: number | null = null,
  options: JudgeOptions = {},
): JudgeResult {
  const { assumeDesignatedCoursesPassed = false } = options
  const warnings: string[] = []
  const { ruleSet: rules, warning: ruleWarning } =
    ruleSetForEntryYear(entryYear)
  if (ruleWarning) warnings.push(ruleWarning)

  const judged = allocateBuckets(courses, rules)
  const passedNames = new Set(
    judged.filter((c) => c.passed).map((c) => normalizeCourseName(c.name)),
  )

  // 1. 必修科目
  const missingRequired = rules.requiredCourses.filter(
    (n) => !passedNames.has(n),
  )
  const requiredOk =
    assumeDesignatedCoursesPassed || missingRequired.length === 0
  const missingAssumedCourses = rules.assumedCourses.filter(
    (n) => !passedNames.has(n),
  )
  const assumedCourseCredits = assumeDesignatedCoursesPassed
    ? missingAssumedCourses.length * rules.assumedCourseCredits
    : 0

  // 2. 選択必修（いずれかのグループを完全修得）
  const electivePassedFromCsv = rules.electiveRequiredGroups.some((group) =>
    group.every((n) => passedNames.has(n)),
  )
  const electiveOk = assumeDesignatedCoursesPassed || electivePassedFromCsv

  // 3〜7. 単位数要件
  const senkoKiso = sumCredits(judged, 'senko-kiso') + assumedCourseCredits
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

  const creditRequirement = (
    id: string,
    label: string,
    current: number,
    required: number,
  ): RequirementResult => ({
    id,
    label: `${label} ${required}単位以上`,
    satisfied: current >= required,
    current,
    required,
    detail:
      current >= required ? '充足' : `あと ${required - current} 単位必要`,
  })

  const requirements: RequirementResult[] = [
    {
      id: 'required',
      label: '必修科目の修得',
      satisfied: requiredOk,
      detail: requiredOk
        ? assumeDesignatedCoursesPassed && missingRequired.length > 0
          ? `${rules.requiredCoursesLabel} を指定科目オプションにより修得済みとして判定`
          : `${rules.requiredCoursesLabel} を修得済み`
        : `未修得の必修科目: ${missingRequired.join('、')}`,
    },
    {
      id: 'elective-required',
      label: '選択必修の修得',
      satisfied: electiveOk,
      detail: electiveOk
        ? assumeDesignatedCoursesPassed && !electivePassedFromCsv
          ? 'コンピュータサイエンス演習Ⅰ・Ⅱを指定科目オプションにより修得済みとして判定'
          : '選択必修グループを修得済み'
        : `${rules.electiveRequiredLabel} を修得してください`,
    },
    creditRequirement(
      'senko-kiso',
      '専攻基礎科目',
      senkoKiso,
      rules.senkoKisoMin,
    ),
    creditRequirement('senmon', '専門教育科目', senmon, rules.senmonMin),
    // 修了要件表の積算ツリー「合計30 = 高度教養(2) + 専門・涵養(28)」より。
    // 高度教養教育科目を2単位超修得しても総計30単位の残り28単位は
    // 専門教育科目・高度国際性涵養教育科目で満たす必要がある
    creditRequirement(
      'senmon-kokusai',
      '専門教育科目＋高度国際性涵養教育科目',
      senmon + kokusai,
      rules.senmonKokusaiMin,
    ),
    creditRequirement(
      'kokusai',
      '高度国際性涵養教育科目',
      kokusai,
      rules.kokusaiMin,
    ),
    creditRequirement(
      'kodo-kyoyo',
      '高度教養教育科目',
      kodoKyoyo,
      rules.kodoKyoyoMin,
    ),
    creditRequirement('total', '総修得単位', total, rules.totalMin),
    {
      id: 'research-guidance',
      label: '研究指導（別に定めるもの）',
      satisfied: null,
      detail:
        '成績 CSV からは判定できません。指導教員・教務係に確認してください。',
    },
    // 必要単位数 0 の区分はその年度の要件に存在しない（2017〜2018年度入学など）
  ].filter((r) => r.required === undefined || r.required > 0)

  const overall = requirements
    .filter((r) => r.satisfied !== null)
    .every((r) => r.satisfied === true)

  return {
    overall,
    requirements,
    courses: judged,
    warnings,
    entryYear,
    ruleSetLabel: rules.label,
  }
}
