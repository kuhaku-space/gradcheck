import { describe, expect, it } from 'vitest'
import { sampleCsv } from './__fixtures__/sampleCsv'
import { judge } from './judge'
import { classifyCourse, parseGradesCsv } from './parseCsv'
import { entryYearFromStudentId } from './studentId'
import type { CourseRecord } from './types'

/** テスト用の科目レコードを作る */
function course(
  name: string,
  detail: string,
  sub: string,
  opts: Partial<CourseRecord> = {},
): CourseRecord {
  return {
    no: 0,
    detailCategory: detail,
    subCategory: sub,
    name,
    credits: 2,
    year: '2024',
    term: '夏学期',
    grade: '合',
    passed: true,
    category: classifyCourse(detail, sub),
    ...opts,
  }
}

const senmon = '専門教育系科目（専門教育科目）'
const kiso = (name: string, opts: Partial<CourseRecord> = {}) =>
  course(name, senmon, '専攻基礎科目（選択）', opts)

function req(result: ReturnType<typeof judge>, id: string) {
  const r = result.requirements.find((r) => r.id === id)
  if (!r) throw new Error(`requirement not found: ${id}`)
  return r
}

describe('judge (フィクスチャCSV: 架空の在学生)', () => {
  const parsed = parseGradesCsv(sampleCsv)
  const result = judge(parsed.courses, entryYearFromStudentId(parsed.studentId))

  it('総合判定は未充足', () => {
    expect(result.overall).toBe(false)
  })

  it('必修・選択必修は充足', () => {
    expect(req(result, 'required').satisfied).toBe(true)
    expect(req(result, 'elective-required').satisfied).toBe(true)
  })

  it('専攻基礎は18単位で不足（不合格科目は算入しない）', () => {
    const r = req(result, 'senko-kiso')
    expect(r.current).toBe(18)
    expect(r.satisfied).toBe(false)
  })

  it('専門教育科目は22単位で充足（専攻基礎18＋専攻境界4）', () => {
    const r = req(result, 'senmon')
    expect(r.current).toBe(22)
    expect(r.satisfied).toBe(true)
  })

  it('高度国際性涵養は二重区分科目（英語プレゼンテーション）の充当で充足', () => {
    const r = req(result, 'kokusai')
    expect(r.current).toBe(2)
    expect(r.satisfied).toBe(true)
    const dual = result.courses.find(
      (c) => c.name === '英語プレゼンテーション',
    )
    expect(dual?.bucket).toBe('kokusai')
  })

  it('高度教養は充足、総単位は26で不足', () => {
    expect(req(result, 'kodo-kyoyo').satisfied).toBe(true)
    const total = req(result, 'total')
    expect(total.current).toBe(26)
    expect(total.satisfied).toBe(false)
  })

  it('不合格科目は単位に算入しない（充当先なし）', () => {
    const failed = result.courses.find((c) => c.name === '画像認識')
    expect(failed?.bucket).toBeNull()
  })

  it('研究指導は判定不能（null）', () => {
    expect(req(result, 'research-guidance').satisfied).toBeNull()
  })
})

describe('judge (合成データ)', () => {
  it('全要件を満たすと overall が true になる', () => {
    const courses: CourseRecord[] = [
      course('コンピュータサイエンス研究Ⅰa', senmon, '専攻基礎科目（必修）'),
      course('コンピュータサイエンス研究Ⅰb', senmon, '専攻基礎科目（必修）'),
      course('コンピュータサイエンス演習Ⅰ', senmon, '専攻基礎科目（選択必修1）'),
      course('コンピュータサイエンス演習Ⅱ', senmon, '専攻基礎科目（選択必修1）'),
      kiso('選択A'),
      kiso('選択B'),
      kiso('選択C'),
      kiso('選択D'),
      kiso('選択E'),
      kiso('選択F'),
      kiso('選択G'),
      course('境界A', senmon, '専攻境界科目'),
      course('境界B', senmon, '専攻境界科目'),
      course(
        '公法の基礎',
        '教養教育系科目（高度教養教育科目）',
        '高度教養教育科目（他学部・他研究科等）',
      ),
      course(
        '英語プレゼンテーション',
        '国際性涵養教育系科目（高度国際性涵養教育科目・専門教育科目）',
        '専攻境界科目',
      ),
    ]
    const result = judge(courses)
    // 専攻基礎 22（必修4＋選択必修4＋選択14）、境界4、教養2、涵養2 → 計30
    expect(req(result, 'senko-kiso').current).toBe(22)
    expect(req(result, 'total').current).toBe(30)
    expect(result.overall).toBe(true)
  })

  it('選択必修はインタラクティブ創成工学基礎演習Aでも充足する', () => {
    const result = judge([
      course('インタラクティブ創成工学基礎演習A', senmon, '専攻基礎科目（選択必修1）', {
        credits: 4,
      }),
    ])
    expect(req(result, 'elective-required').satisfied).toBe(true)
  })

  it('演習Ⅰのみでは選択必修を満たさない', () => {
    const result = judge([
      course('コンピュータサイエンス演習Ⅰ', senmon, '専攻基礎科目（選択必修1）'),
    ])
    expect(req(result, 'elective-required').satisfied).toBe(false)
  })

  it('二重区分: 涵養1単位が充足済みなら2科目目は専門教育側に充当する', () => {
    const dualDetail =
      '国際性涵養教育系科目（高度国際性涵養教育科目・専門教育科目）'
    const result = judge([
      course('コンピュータサイエンス基礎論', dualDetail, '専攻基礎科目（選択）'),
      course('英語プレゼンテーション', dualDetail, '専攻境界科目'),
    ])
    const buckets = result.courses.map((c) => [c.name, c.bucket])
    expect(buckets).toContainEqual(['コンピュータサイエンス基礎論', 'kokusai'])
    expect(buckets).toContainEqual(['英語プレゼンテーション', 'senko-kyokai'])
    expect(req(result, 'kokusai').current).toBe(2)
  })

  it('区分不明の科目は総単位に算入しつつ警告する', () => {
    const result = judge([course('謎科目', '謎の区分', '')])
    expect(req(result, 'total').current).toBe(2)
    expect(result.warnings.some((w) => w.includes('区分を判定できない'))).toBe(
      true,
    )
  })

  it('必修未修得を検出する', () => {
    const result = judge([kiso('選択A')])
    const r = req(result, 'required')
    expect(r.satisfied).toBe(false)
    expect(r.detail).toContain('研究')
  })

  it('入学年度が不明な場合はルールセットの警告を結果に含める', () => {
    const result = judge([kiso('選択A')], null)
    expect(result.warnings.some((w) => w.includes('推定できなかった'))).toBe(true)
  })

  it('要件定義より前の入学年度では注意の警告を結果に含める', () => {
    const result = judge([kiso('選択A')], 2016)
    expect(result.warnings.some((w) => w.includes('要件定義がない'))).toBe(true)
  })

  it('2017〜2018年度入学には教養・涵養の区分要件が課されない', () => {
    const result = judge([kiso('選択A')], 2018)
    const ids = result.requirements.map((r) => r.id)
    expect(ids).toContain('senko-kiso')
    expect(ids).toContain('total')
    expect(ids).not.toContain('senmon')
    expect(ids).not.toContain('senmon-kokusai')
    expect(ids).not.toContain('kokusai')
    expect(ids).not.toContain('kodo-kyoyo')
  })

  it('高度教養を2単位超修得しても専門＋涵養28単位は必要', () => {
    const kyoyo = (name: string) =>
      course(
        name,
        '教養教育系科目（高度教養教育科目）',
        '高度教養教育科目（他学部・他研究科等）',
      )
    const courses: CourseRecord[] = [
      // 専攻基礎 22 + 境界 2 + 涵養 2 = 専門・涵養 26 < 28
      course('コンピュータサイエンス研究Ⅰa', senmon, '専攻基礎科目（必修）'),
      course('コンピュータサイエンス研究Ⅰb', senmon, '専攻基礎科目（必修）'),
      course('コンピュータサイエンス演習Ⅰ', senmon, '専攻基礎科目（選択必修1）'),
      course('コンピュータサイエンス演習Ⅱ', senmon, '専攻基礎科目（選択必修1）'),
      ...['A', 'B', 'C', 'D', 'E', 'F', 'G'].map((s) => kiso(`選択${s}`)),
      course('境界A', senmon, '専攻境界科目'),
      course(
        '英語プレゼンテーション',
        '国際性涵養教育系科目（高度国際性涵養教育科目・専門教育科目）',
        '専攻境界科目',
      ),
      // 教養を4単位取って総計30に届かせても専門＋涵養が不足
      kyoyo('教養A'),
      kyoyo('教養B'),
    ]
    const result = judge(courses, 2024)
    expect(req(result, 'total').current).toBe(30)
    expect(req(result, 'total').satisfied).toBe(true)
    const sk = req(result, 'senmon-kokusai')
    expect(sk.current).toBe(26)
    expect(sk.satisfied).toBe(false)
    expect(result.overall).toBe(false)
  })
})
