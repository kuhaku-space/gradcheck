import { describe, expect, it } from 'vitest'
import { entryYearFromStudentId } from './studentId'

describe('entryYearFromStudentId', () => {
  it('学籍番号の3〜4文字目の数字を入学年度として読む', () => {
    expect(entryYearFromStudentId('33C24019')).toBe(2024)
    expect(entryYearFromStudentId('33C25123')).toBe(2025)
  })

  it('前後の空白を無視する', () => {
    expect(entryYearFromStudentId(' 33C24019 ')).toBe(2024)
  })

  it('形式が想定と異なる場合は null を返す', () => {
    expect(entryYearFromStudentId(null)).toBeNull()
    expect(entryYearFromStudentId('')).toBeNull()
    expect(entryYearFromStudentId('ABC12345')).toBeNull()
    expect(entryYearFromStudentId('3C24019')).toBeNull()
    expect(entryYearFromStudentId('33224019')).toBeNull()
  })
})
