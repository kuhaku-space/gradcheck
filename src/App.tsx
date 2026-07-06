import { useCallback, useState } from 'react'
import { decodeCsvBytes } from './lib/decode'
import { judge } from './lib/judge'
import { parseGradesCsv } from './lib/parseCsv'
import type { JudgeResult } from './lib/types'
import { CourseTable } from './components/CourseTable'
import { FileDropZone } from './components/FileDropZone'
import { RequirementTable } from './components/RequirementTable'

interface LoadedResult {
  fileName: string
  studentId: string | null
  result: JudgeResult
  warnings: string[]
}

export default function App() {
  const [loaded, setLoaded] = useState<LoadedResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleFile = useCallback(async (file: File) => {
    setError(null)
    try {
      const text = decodeCsvBytes(await file.arrayBuffer())
      const parsed = parseGradesCsv(text)
      const result = judge(parsed.courses)
      setLoaded({
        fileName: file.name,
        studentId: parsed.studentId,
        result,
        warnings: [...parsed.warnings, ...result.warnings],
      })
    } catch (e) {
      setLoaded(null)
      setError(e instanceof Error ? e.message : String(e))
    }
  }, [])

  return (
    <main className="container">
      <header>
        <h1>修了要件チェッカー</h1>
        <p className="subtitle">
          大阪大学大学院情報科学研究科 博士前期課程（コンピュータサイエンス専攻）
        </p>
      </header>

      <FileDropZone onFile={handleFile} />
      <p className="privacy-note">
        ファイルはブラウザ内でのみ処理され、サーバには送信されません。
      </p>

      {error && <div className="banner banner-error">{error}</div>}

      {loaded && (
        <>
          <div
            className={`banner ${loaded.result.overall ? 'banner-ok' : 'banner-ng'}`}
          >
            <strong>
              {loaded.result.overall
                ? '単位要件を満たしています'
                : '単位要件を満たしていません'}
            </strong>
            <span className="banner-meta">
              {loaded.fileName}
              {loaded.studentId && ` ・ 学籍番号 ${loaded.studentId}`}
            </span>
          </div>

          {loaded.warnings.length > 0 && (
            <div className="banner banner-warn">
              <ul>
                {loaded.warnings.map((w) => (
                  <li key={w}>{w}</li>
                ))}
              </ul>
            </div>
          )}

          <section>
            <h2>要件別の充足状況</h2>
            <RequirementTable requirements={loaded.result.requirements} />
          </section>

          <section>
            <h2>読み込んだ科目一覧</h2>
            <CourseTable courses={loaded.result.courses} />
          </section>
        </>
      )}

      <footer>
        <p>
          本アプリの判定は
          <a
            href="https://www.osaka-u.ac.jp/kitei/reiki_honbun/u035RG00000399.html"
            target="_blank"
            rel="noreferrer"
          >
            情報科学研究科規程 別表1
          </a>
          に基づく参考情報です。正式な修了判定は必ず教務係に確認してください。
        </p>
      </footer>
    </main>
  )
}
