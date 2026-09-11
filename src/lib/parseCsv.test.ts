import { describe, expect, it } from 'vitest'
import { sampleCsv } from './__fixtures__/sampleCsv'
import {
  classifyCourse,
  parseGradesCsv,
  parseGradesFile,
  parseGradesText,
} from './parseCsv'

describe('parseGradesCsv', () => {
  it('副専攻セクションを読み飛ばして科目行だけを取り出す', () => {
    const { courses, studentId } = parseGradesCsv(sampleCsv)
    expect(courses).toHaveLength(14)
    expect(studentId).toBe('33C99999')
  })

  it('科目のフィールドを正しく読み取る', () => {
    const { courses } = parseGradesCsv(sampleCsv)
    const first = courses[0]
    expect(first).toMatchObject({
      no: 1,
      name: 'コンピュータサイエンス研究Ia',
      credits: 2,
      year: '2023',
      term: '夏学期',
      grade: '合',
      passed: true,
      category: 'senko-kiso-required',
    })
  })

  it('不合格（否）を passed: false として読む', () => {
    const { courses } = parseGradesCsv(sampleCsv)
    const failed = courses.find((c) => c.name === '画像認識')
    expect(failed?.passed).toBe(false)
  })

  it('ヘッダ行がない場合はエラーを投げる', () => {
    expect(() => parseGradesCsv('a,b,c\n1,2,3')).toThrow(/ヘッダ行/)
  })
})

describe('parseGradesText', () => {
  const sampleText = `"所属コード","学籍番号 ","No","時間割コード","開講科目名 ","修得年度","評語","合否"
"330103","33C99999","1","331003","情報科学特別講義I","2026","Ａ","合"
"330103","33C99999","2","331325","コンピュータサイエンス基礎論","2026","Ａ＋","合"
"330103","33C99999","3","999999","未知科目","2026","Ｆ","否"`

  it('省略された単位数と既知科目の区分を補う', () => {
    const result = parseGradesText(sampleText)
    expect(result.studentId).toBe('33C99999')
    expect(result.courses).toHaveLength(3)
    expect(result.courses[0]).toMatchObject({
      credits: 2,
      term: '',
      category: 'senko-kiso-elective',
    })
    expect(result.courses[1].category).toBe('dual')
  })

  it('未知科目は区分不明として警告する', () => {
    const result = parseGradesText(sampleText)
    expect(result.courses[2].category).toBe('unknown')
    expect(result.courses[2].passed).toBe(false)
    expect(result.warnings.some((warning) => warning.includes('未知科目'))).toBe(true)
  })

  it('列構成からCSVとTXTを自動判別する', () => {
    expect(parseGradesFile(sampleCsv).courses).toHaveLength(14)
    expect(parseGradesFile(sampleText).courses).toHaveLength(3)
  })
})

describe('classifyCourse', () => {
  const cases: Array<[string, string, string]> = [
    ['専門教育系科目（専門教育科目）', '専攻基礎科目（必修）', 'senko-kiso-required'],
    ['専門教育系科目（専門教育科目）', '専攻基礎科目（選択必修1）', 'senko-kiso-elective-required'],
    ['専門教育系科目（専門教育科目）', '専攻基礎科目（選択）', 'senko-kiso-elective'],
    ['専門教育系科目（専門教育科目）', '専攻境界科目', 'senko-kyokai'],
    ['教養教育系科目（高度教養教育科目）', '高度教養教育科目（他学部・他研究科等）', 'kodo-kyoyo'],
    ['国際性涵養教育系科目（高度国際性涵養教育科目・専門教育科目）', '専攻基礎科目（選択）', 'dual'],
    ['国際性涵養教育系科目（高度国際性涵養教育科目）', '', 'kokusai'],
    ['謎の区分', '謎の小区分', 'unknown'],
  ]
  it.each(cases)('%s / %s → %s', (detail, sub, expected) => {
    expect(classifyCourse(detail, sub)).toBe(expected)
  })
})
