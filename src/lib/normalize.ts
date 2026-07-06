/**
 * 科目名の表記ゆれを吸収する正規化。
 * KOAN の CSV・規程・シラバスでローマ数字（Ⅰ/I/Ｉ）や空白の扱いが揺れるため、
 * 照合はすべてこの関数を通した文字列同士で行う。
 */
const ROMAN_MAP: Record<string, string> = {
  Ⅰ: 'I',
  Ⅱ: 'II',
  Ⅲ: 'III',
  Ⅳ: 'IV',
  Ⅴ: 'V',
  ⅰ: 'I',
  ⅱ: 'II',
  ⅲ: 'III',
}

export function normalizeCourseName(name: string): string {
  let s = name.trim()
  // 全角英数字 → 半角
  s = s.replace(/[Ａ-Ｚａ-ｚ０-９]/g, (c) =>
    String.fromCharCode(c.charCodeAt(0) - 0xfee0),
  )
  // ローマ数字合字 → 半角英字
  s = s.replace(/[ⅠⅡⅢⅣⅤⅰⅱⅲ]/g, (c) => ROMAN_MAP[c] ?? c)
  // 空白（全角含む）を除去
  s = s.replace(/[\s　]+/g, '')
  return s.toUpperCase()
}
