import { describe, expect, it } from 'vitest'
import { normalizeCourseName } from './normalize'
import { RULE_SETS, ruleSetForEntryYear } from './rules'

describe('ruleSetForEntryYear', () => {
  const earliest = RULE_SETS[0]
  const latest = RULE_SETS[RULE_SETS.length - 1]

  it('定義範囲内の入学年度には該当ルールセットを警告なしで返す', () => {
    const { ruleSet, warning } = ruleSetForEntryYear(latest.fromEntryYear)
    expect(ruleSet).toBe(latest)
    expect(warning).toBeNull()
  })

  it('定義より後の入学年度には最新の定義を適用する', () => {
    const { ruleSet, warning } = ruleSetForEntryYear(latest.fromEntryYear + 10)
    expect(ruleSet).toBe(latest)
    expect(warning).toBeNull()
  })

  it('入学年度が不明な場合は最新の定義＋警告を返す', () => {
    const { ruleSet, warning } = ruleSetForEntryYear(null)
    expect(ruleSet).toBe(latest)
    expect(warning).toContain('推定できなかった')
  })

  it('定義より前の入学年度には最古の定義＋警告を返す', () => {
    const { ruleSet, warning } = ruleSetForEntryYear(
      earliest.fromEntryYear - 1,
    )
    expect(ruleSet).toBe(earliest)
    expect(warning).toContain('要件定義がない')
  })

  it('年度の境界で正しいルールセットを選ぶ', () => {
    expect(ruleSetForEntryYear(2017).ruleSet.fromEntryYear).toBe(2017)
    expect(ruleSetForEntryYear(2018).ruleSet.fromEntryYear).toBe(2017)
    expect(ruleSetForEntryYear(2019).ruleSet.fromEntryYear).toBe(2019)
    expect(ruleSetForEntryYear(2024).ruleSet.fromEntryYear).toBe(2019)
  })

  it('ルールセットは入学年度の昇順に並んでいる', () => {
    const years = RULE_SETS.map((r) => r.fromEntryYear)
    expect(years).toEqual([...years].sort((a, b) => a - b))
  })

  it('修了要件の必修は研究Ⅰa・Ⅰbだけを扱う', () => {
    expect(latest.requiredCourses).toEqual(
      ['コンピュータサイエンス研究Ⅰa', 'コンピュータサイエンス研究Ⅰb'].map(
        normalizeCourseName,
      ),
    )
  })

  it('指定8科目を修得済みオプションの加算対象にする', () => {
    expect(latest.assumedCourses).toEqual(
      [
        'コンピュータサイエンス研究Ⅰa',
        'コンピュータサイエンス研究Ⅰb',
        'コンピュータサイエンス演習Ⅰ',
        'コンピュータサイエンス演習Ⅱ',
        'コンピュータサイエンスセミナーⅠ',
        'コンピュータサイエンスセミナーⅡ',
        'コンピュータサイエンス研究Ⅱa',
        'コンピュータサイエンス研究Ⅱb',
      ].map(normalizeCourseName),
    )
  })
})
