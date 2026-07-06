/**
 * 学籍番号から入学年度を推定する。
 *
 * 情報科学研究科の学籍番号は「33C24019」のように
 * 所属2桁 + 課程等の英字1文字 + 入学年度下2桁 + 連番 という構成のため、
 * 3〜4文字目の数字を 2000 年代の西暦として読む。
 * 形式が想定と異なる場合は null を返す（呼び出し側で最新ルールに
 * フォールバックし警告を出す）。
 */
export function entryYearFromStudentId(
  studentId: string | null,
): number | null {
  if (!studentId) return null
  const m = /^\d{2}[A-Za-z](\d{2})\d+$/.exec(studentId.trim())
  if (!m) return null
  return 2000 + Number(m[1])
}
