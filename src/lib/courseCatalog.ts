import type { Category } from './types'
import { EXTERNAL_COURSE_CATALOG } from './courseCatalog.generated'

export interface CourseMetadata {
  credits: number
  category: Category
  detailCategory: string
  subCategory: string
}

type CompactMetadata = readonly [credits: number, category: Category]

const CORE_REQUIRED = new Set(['331321', '331322'])
const CORE_ELECTIVE_REQUIRED = new Set(['331312', '331313', '331426'])
const CORE_ELECTIVE = new Set([
  '331003', '331004', '331303', '331304', '331305', '331307', '331308',
  '331310', '331311', '331318', '331319', '331323', '331324', '331326',
  '331337', '331338', '331339',
])
const DUAL_CORE = new Set(['331325'])
const BOUNDARY = new Set([
  '331005', '331014', '331135', '331222', '331408', '331420', '331431',
  '331432', '331501', '331507', '331508', '331511', '331525', '331529',
  '331621', '331622', '331635', '331636', '331641', '331642', '331701',
  '331702', '331720', '331721', '331724', '331732',
])
const DUAL_BOUNDARY = new Set(['331006', '331639', '331025', '331027'])
const SPECIAL_CREDITS: Record<string, number> = {
  '331426': 4,
  '331025': 4,
  '331027': 8,
}

function metadata(credits: number, category: Category): CourseMetadata {
  switch (category) {
    case 'senko-kiso-required':
      return { credits, category, detailCategory: '専門教育系科目（専門教育科目）', subCategory: '専攻基礎科目（必修）' }
    case 'senko-kiso-elective-required':
      return { credits, category, detailCategory: '専門教育系科目（専門教育科目）', subCategory: '専攻基礎科目（選択必修1）' }
    case 'senko-kiso-elective':
      return { credits, category, detailCategory: '専門教育系科目（専門教育科目）', subCategory: '専攻基礎科目（選択）' }
    case 'senko-kyokai':
      return { credits, category, detailCategory: '専門教育系科目（専門教育科目）', subCategory: '専攻境界科目' }
    case 'dual':
      return { credits, category, detailCategory: '国際性涵養教育系科目（高度国際性涵養教育科目・専門教育科目）', subCategory: '専攻境界科目' }
    case 'kodo-kyoyo':
      return { credits, category, detailCategory: '教養教育系科目（高度教養教育科目）', subCategory: '高度教養教育科目（他学部・他研究科等）' }
    case 'kokusai':
      return { credits, category, detailCategory: '国際性涵養教育系科目（高度国際性涵養教育科目）', subCategory: '' }
    case 'unknown':
      return { credits, category, detailCategory: '', subCategory: '' }
  }
}

export function courseMetadataForCode(code: string): CourseMetadata | null {
  const credits = SPECIAL_CREDITS[code] ?? 2
  if (CORE_REQUIRED.has(code)) return metadata(credits, 'senko-kiso-required')
  if (CORE_ELECTIVE_REQUIRED.has(code)) return metadata(credits, 'senko-kiso-elective-required')
  if (CORE_ELECTIVE.has(code)) return metadata(credits, 'senko-kiso-elective')
  if (DUAL_CORE.has(code)) {
    return { ...metadata(credits, 'dual'), subCategory: '専攻基礎科目（選択）' }
  }
  if (BOUNDARY.has(code)) return metadata(credits, 'senko-kyokai')
  if (DUAL_BOUNDARY.has(code)) return metadata(credits, 'dual')

  const external: CompactMetadata | undefined = EXTERNAL_COURSE_CATALOG[code]
  return external ? metadata(external[0], external[1]) : null
}
