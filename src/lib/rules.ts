/**
 * 大阪大学大学院情報科学研究科 博士前期課程 コンピュータサイエンス専攻の修了要件。
 *
 * 根拠: 大阪大学大学院情報科学研究科規程 別表1（前期課程）
 * https://www.osaka-u.ac.jp/kitei/reiki_honbun/u035RG00000399.html
 * 詳細は docs/requirements.md を参照。規程改定時はこのファイルを更新する。
 */
import { normalizeCourseName } from './normalize'

/** 必修科目（すべて合格が必要） */
export const REQUIRED_COURSES = [
  'コンピュータサイエンス研究Ⅰa',
  'コンピュータサイエンス研究Ⅰb',
].map(normalizeCourseName)

/**
 * 選択必修: いずれかのグループの科目をすべて合格すること（4単位）。
 * 1. コンピュータサイエンス演習Ⅰ 及び コンピュータサイエンス演習Ⅱ
 * 2. インタラクティブ創成工学基礎演習A
 */
export const ELECTIVE_REQUIRED_GROUPS: string[][] = [
  ['コンピュータサイエンス演習Ⅰ', 'コンピュータサイエンス演習Ⅱ'],
  ['インタラクティブ創成工学基礎演習A'],
].map((group) => group.map(normalizeCourseName))

/** 専攻基礎科目の必要単位数 */
export const SENKO_KISO_MIN = 22

/** 専門教育科目（専攻基礎＋専攻境界）の必要単位数 */
export const SENMON_MIN = 22

/** 高度国際性涵養教育科目の必要単位数 */
export const KOKUSAI_MIN = 1

/** 高度教養教育科目の必要単位数 */
export const KODO_KYOYO_MIN = 2

/** 修了に必要な総単位数 */
export const TOTAL_MIN = 30
