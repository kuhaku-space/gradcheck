/** 科目の教育課程上の区分（CSV の科目詳細区分・科目小区分から判定） */
export type Category =
  | 'senko-kiso-required' // 専攻基礎科目（必修）
  | 'senko-kiso-elective-required' // 専攻基礎科目（選択必修）
  | 'senko-kiso-elective' // 専攻基礎科目（選択）
  | 'senko-kyokai' // 専攻境界科目
  | 'kodo-kyoyo' // 高度教養教育科目
  | 'kokusai' // 高度国際性涵養教育科目
  | 'dual' // 専門教育科目・高度国際性涵養教育科目の二重区分
  | 'unknown'

/** 成績 CSV の 1 行（科目） */
export interface CourseRecord {
  no: number
  /** 科目詳細区分（例: 専門教育系科目（専門教育科目）） */
  detailCategory: string
  /** 科目小区分（例: 専攻基礎科目（必修）） */
  subCategory: string
  /** 開講科目名 */
  name: string
  credits: number
  /** 修得年度 */
  year: string
  /** 修得学期 */
  term: string
  /** 評語（Ｓ/Ａ/Ｂ/Ｃ/Ｆ/合 など） */
  grade: string
  /** 合否列が「合」か */
  passed: boolean
  category: Category
}

/** 単位の最終的な充当先 */
export type Bucket =
  | 'senko-kiso' // 専攻基礎科目
  | 'senko-kyokai' // 専攻境界科目
  | 'kodo-kyoyo' // 高度教養教育科目
  | 'kokusai' // 高度国際性涵養教育科目
  | 'unknown'

export interface JudgedCourse extends CourseRecord {
  /** 合格科目の充当先（不合格は null） */
  bucket: Bucket | null
}

export interface RequirementResult {
  id: string
  label: string
  /** null = CSV からは判定不能（研究指導など） */
  satisfied: boolean | null
  /** 現在の修得単位数（単位数で表せない要件では省略） */
  current?: number
  /** 必要単位数（単位数で表せない要件では省略） */
  required?: number
  detail: string
}

export interface ParseResult {
  studentId: string | null
  courses: CourseRecord[]
  warnings: string[]
}

export interface JudgeResult {
  /** 判定可能な全要件を満たしているか（研究指導など判定不能項目は除く） */
  overall: boolean
  requirements: RequirementResult[]
  courses: JudgedCourse[]
  warnings: string[]
}
