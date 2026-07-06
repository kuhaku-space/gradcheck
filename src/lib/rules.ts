/**
 * 大阪大学大学院情報科学研究科 博士前期課程 コンピュータサイエンス専攻の
 * 修了要件を入学年度別のルールセットとして定義する。
 *
 * 修了要件は「現在の規程」ではなく「入学時点の規程＋経過措置」で決まるため、
 * 規程改定で単位数要件等が変わった場合は RULE_SETS に新しい入学年度からの
 * 定義を追加する（既存の定義は変更しない）。
 *
 * 根拠: 大阪大学大学院情報科学研究科規程 別表1（前期課程）
 * https://www.osaka-u.ac.jp/kitei/reiki_honbun/u035RG00000399.html
 * 詳細は docs/requirements.md を参照。
 */
import { normalizeCourseName } from './normalize'

export interface RuleSet {
  /** この定義が適用される最初の入学年度（西暦） */
  fromEntryYear: number
  /** UI 表示用のラベル */
  label: string
  /** 必修科目（すべて合格が必要）。normalizeCourseName 済み */
  requiredCourses: string[]
  /** 必修科目の表示用ラベル */
  requiredCoursesLabel: string
  /** 選択必修: いずれかのグループの科目をすべて合格すること。normalizeCourseName 済み */
  electiveRequiredGroups: string[][]
  /** 選択必修の表示用ラベル */
  electiveRequiredLabel: string
  /** 専攻基礎科目の必要単位数 */
  senkoKisoMin: number
  /** 専門教育科目（専攻基礎＋専攻境界）の必要単位数 */
  senmonMin: number
  /** 高度国際性涵養教育科目の必要単位数 */
  kokusaiMin: number
  /** 高度教養教育科目の必要単位数 */
  kodoKyoyoMin: number
  /** 修了に必要な総単位数 */
  totalMin: number
}

/** 入学年度の昇順で並べる */
export const RULE_SETS: RuleSet[] = [
  {
    fromEntryYear: 2024,
    label: '2024年度以降入学（現行規程に基づく）',
    requiredCourses: [
      'コンピュータサイエンス研究Ⅰa',
      'コンピュータサイエンス研究Ⅰb',
    ].map(normalizeCourseName),
    requiredCoursesLabel: 'コンピュータサイエンス研究Ⅰa・Ⅰb',
    electiveRequiredGroups: [
      ['コンピュータサイエンス演習Ⅰ', 'コンピュータサイエンス演習Ⅱ'],
      ['インタラクティブ創成工学基礎演習A'],
    ].map((group) => group.map(normalizeCourseName)),
    electiveRequiredLabel:
      '「コンピュータサイエンス演習Ⅰ及びⅡ」または「インタラクティブ創成工学基礎演習A」（4単位）',
    senkoKisoMin: 22,
    senmonMin: 22,
    kokusaiMin: 1,
    kodoKyoyoMin: 2,
    totalMin: 30,
  },
]

export interface RuleSetSelection {
  ruleSet: RuleSet
  /** ルールセットを確定できない事情がある場合の注意文 */
  warning: string | null
}

/**
 * 入学年度に適用されるルールセットを選ぶ。
 * - 入学年度が不明な場合は最新の定義を使い、警告を付ける
 * - 定義より前の入学年度の場合は最古の定義を使い、警告を付ける
 *   （経過措置により要件が異なる可能性があるため）
 */
export function ruleSetForEntryYear(entryYear: number | null): RuleSetSelection {
  const latest = RULE_SETS[RULE_SETS.length - 1]
  if (entryYear === null) {
    return {
      ruleSet: latest,
      warning:
        '学籍番号から入学年度を推定できなかったため、最新の修了要件で判定しています。',
    }
  }
  const applicable = [...RULE_SETS]
    .reverse()
    .find((r) => r.fromEntryYear <= entryYear)
  if (!applicable) {
    return {
      ruleSet: RULE_SETS[0],
      warning:
        `${entryYear}年度入学に対応する要件定義がないため、` +
        `${RULE_SETS[0].fromEntryYear}年度以降入学の要件で判定しています。` +
        '経過措置により実際の要件と異なる可能性があります。',
    }
  }
  return { ruleSet: applicable, warning: null }
}
