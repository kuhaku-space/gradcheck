import { describe, expect, it } from 'vitest'
import { normalizeCourseName } from './normalize'

describe('normalizeCourseName', () => {
  it('ローマ数字合字と半角英字を同一視する', () => {
    expect(normalizeCourseName('コンピュータサイエンス研究Ⅰa')).toBe(
      normalizeCourseName('コンピュータサイエンス研究Ia'),
    )
    expect(normalizeCourseName('コンピュータサイエンス演習Ⅱ')).toBe(
      normalizeCourseName('コンピュータサイエンス演習II'),
    )
  })

  it('全角英数字を半角に揃える', () => {
    expect(normalizeCourseName('演習Ａ')).toBe(normalizeCourseName('演習A'))
  })

  it('前後・途中の空白を無視する', () => {
    expect(normalizeCourseName('開講科目名 ')).toBe(
      normalizeCourseName('開講科目名'),
    )
    expect(normalizeCourseName('知的財産の基礎 (情報科学を中心に)')).toBe(
      normalizeCourseName('知的財産の基礎(情報科学を中心に)'),
    )
  })

  it('大文字小文字を同一視する', () => {
    expect(normalizeCourseName('研究Ⅰa')).toBe(normalizeCourseName('研究ⅠA'))
  })
})
