import { describe, expect, it } from 'vitest'
import { courseMetadataForCode } from './courseCatalog'

describe('courseMetadataForCode', () => {
  it('CS専攻の全区分と特殊な単位数を引ける', () => {
    expect(courseMetadataForCode('331321')).toMatchObject({
      credits: 2,
      category: 'senko-kiso-required',
    })
    expect(courseMetadataForCode('331313')?.category).toBe(
      'senko-kiso-elective-required',
    )
    expect(courseMetadataForCode('331426')).toMatchObject({
      credits: 4,
      category: 'senko-kiso-elective-required',
    })
    expect(courseMetadataForCode('331325')?.category).toBe('dual')
    expect(courseMetadataForCode('331636')?.category).toBe('senko-kyokai')
    expect(courseMetadataForCode('331027')).toMatchObject({
      credits: 8,
      category: 'dual',
    })
  })

  it('公式別紙の高度教養・高度国際性涵養科目を引ける', () => {
    expect(courseMetadataForCode('450241')).toMatchObject({
      credits: 2,
      category: 'kodo-kyoyo',
    })
    expect(courseMetadataForCode('290735')).toMatchObject({
      credits: 1,
      category: 'kokusai',
    })
  })

  it('公式表にないコードはnullを返す', () => {
    expect(courseMetadataForCode('999999')).toBeNull()
  })
})
