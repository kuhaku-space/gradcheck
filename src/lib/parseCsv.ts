/**
 * KOAN 成績 CSV のパース。
 *
 * ファイル構造（docs/csv-format.md 参照）:
 *   1行目: 「受講申請している副専攻・高度副プログラム」
 *   2行目: 副専攻プログラムのヘッダ
 *   3行目〜: 副専攻の内容（申請なしの場合は文言 1 行）
 *   n行目: 成績ヘッダ（「開講科目名」を含む行）
 *   n+1行目〜: 科目データ
 *
 * ヘッダ行は「開講科目名」を含む行を探して特定する（行位置に依存しない）。
 * 各行は行末に「,\t」のゴミが付くため、余剰列は無視する。
 */
import Papa from 'papaparse'
import { courseMetadataForCode } from './courseCatalog'
import type { Category, CourseRecord, ParseResult } from './types'

type CsvRow = string[]

interface ParsedTable {
  rows: CsvRow[]
  header: string[]
  warnings: string[]
}

function parseTable(text: string, source: 'CSV' | 'TXT'): ParsedTable {
  const parsed = Papa.parse<CsvRow>(text.trim(), {
    skipEmptyLines: 'greedy',
  })
  const warnings = parsed.errors
    .filter((error) => error.type !== 'FieldMismatch')
    .map(
      (error) =>
        `${source}解析警告 (行${(error.row ?? 0) + 1}): ${error.message}`,
    )
  const headerIndex = parsed.data.findIndex((row) =>
    row.some((cell) => cell.trim() === '開講科目名'),
  )
  if (headerIndex < 0) {
    throw new Error(
      '成績データのヘッダ行（「開講科目名」を含む行）が見つかりません。',
    )
  }
  return {
    rows: parsed.data.slice(headerIndex + 1),
    header: parsed.data[headerIndex].map((cell) => cell.trim()),
    warnings,
  }
}

function validateColumns(
  indexes: Record<string, number>,
  source: 'CSV' | 'TXT',
): void {
  const missing = Object.entries(indexes)
    .filter(([, index]) => index < 0)
    .map(([name]) => name)
  if (missing.length > 0) {
    throw new Error(
      `成績 ${source} に必要な列が見つかりません: ${missing.join(', ')}`,
    )
  }
}

function finishParseResult(
  studentId: string | null,
  courses: CourseRecord[],
  warnings: string[],
): ParseResult {
  if (courses.length === 0) {
    warnings.push('科目データが 1 件も読み取れませんでした。')
  }
  return { studentId, courses, warnings }
}

/** 科目詳細区分・科目小区分から教育課程上の区分を決める */
export function classifyCourse(
  detailCategory: string,
  subCategory: string,
): Category {
  const detail = detailCategory
  const sub = subCategory
  if (detail.includes('国際性涵養')) {
    // 「高度国際性涵養教育科目・専門教育科目」は二重区分（充当規則の対象）
    return detail.includes('専門教育科目') ? 'dual' : 'kokusai'
  }
  if (detail.includes('教養教育')) return 'kodo-kyoyo'
  if (detail.includes('専門教育')) {
    if (sub.includes('専攻境界')) return 'senko-kyokai'
    if (sub.includes('専攻基礎')) {
      if (sub.includes('選択必修')) return 'senko-kiso-elective-required'
      if (sub.includes('必修')) return 'senko-kiso-required'
      return 'senko-kiso-elective'
    }
  }
  return 'unknown'
}

export function parseGradesCsv(text: string): ParseResult {
  const { rows, header, warnings } = parseTable(text, 'CSV')
  const col = (name: string) => header.indexOf(name)
  const idx = {
    studentId: col('学籍番号'),
    no: col('No.'),
    detailCategory: col('科目詳細区分'),
    subCategory: col('科目小区分'),
    name: col('開講科目名'),
    credits: col('単位数'),
    year: col('修得年度'),
    term: col('修得学期'),
    grade: col('評語'),
    passed: col('合否'),
  }
  validateColumns(idx, 'CSV')

  const courses: CourseRecord[] = []
  let studentId: string | null = null
  for (const row of rows) {
    const no = Number.parseInt(row[idx.no] ?? '', 10)
    // No. が数値でない行はデータ行ではない（フッタ・別セクション等）
    if (Number.isNaN(no)) continue

    studentId ??= row[idx.studentId]?.trim() || null
    const name = (row[idx.name] ?? '').trim()
    const credits = Number.parseFloat(row[idx.credits] ?? '')
    if (name === '' || Number.isNaN(credits)) {
      warnings.push(`行 No.${no} の科目名または単位数が読み取れませんでした。`)
      continue
    }
    const detailCategory = (row[idx.detailCategory] ?? '').trim()
    const subCategory = (row[idx.subCategory] ?? '').trim()
    courses.push({
      no,
      detailCategory,
      subCategory,
      name,
      credits,
      year: (row[idx.year] ?? '').trim(),
      term: (row[idx.term] ?? '').trim(),
      grade: (row[idx.grade] ?? '').trim(),
      passed: (row[idx.passed] ?? '').trim() === '合',
      category: classifyCourse(detailCategory, subCategory),
    })
  }

  return finishParseResult(studentId, courses, warnings)
}

/**
 * SIRS のテキスト出力をパースする。
 * この形式には科目区分・単位数・学期がないため、公式の2026年度科目表を元に
 * 時間割コードから区分と単位数を補う。未知の科目は区分不明として警告する。
 */
export function parseGradesText(text: string): ParseResult {
  const { rows, header, warnings } = parseTable(text, 'TXT')
  const col = (name: string) => header.indexOf(name)
  const idx = {
    studentId: col('学籍番号'),
    no: col('No'),
    code: col('時間割コード'),
    name: col('開講科目名'),
    year: col('修得年度'),
    grade: col('評語'),
    passed: col('合否'),
  }
  validateColumns(idx, 'TXT')

  const courses: CourseRecord[] = []
  let studentId: string | null = null
  for (const row of rows) {
    const no = Number.parseInt(row[idx.no] ?? '', 10)
    if (Number.isNaN(no)) continue

    studentId ??= row[idx.studentId]?.trim() || null
    const name = (row[idx.name] ?? '').trim()
    if (name === '') {
      warnings.push(`行 No.${no} の科目名が読み取れませんでした。`)
      continue
    }
    const code = (row[idx.code] ?? '').trim().toUpperCase()
    const metadata = courseMetadataForCode(code)
    const detailCategory = metadata?.detailCategory ?? ''
    const subCategory = metadata?.subCategory ?? ''
    if (!metadata) {
      warnings.push(
        `${name}（時間割コード ${code || '不明'}）は2026年度科目表にないため区分不明として扱います。`,
      )
    }
    courses.push({
      no,
      detailCategory,
      subCategory,
      name,
      credits: metadata?.credits ?? 0,
      year: (row[idx.year] ?? '').trim(),
      term: '',
      grade: (row[idx.grade] ?? '').trim(),
      passed: (row[idx.passed] ?? '').trim() === '合',
      category: metadata?.category ?? 'unknown',
    })
  }

  return finishParseResult(studentId, courses, warnings)
}

/** 列構成からKOAN CSVまたはSIRS TXTを自動判別してパースする。 */
export function parseGradesFile(text: string): ParseResult {
  return text.includes('科目詳細区分')
    ? parseGradesCsv(text)
    : parseGradesText(text)
}
