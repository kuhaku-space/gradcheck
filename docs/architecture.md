# アーキテクチャ

クライアントサイド完結の SPA。成績データはブラウザの外に出ない。
技術選定の経緯は [tech-selection.md](tech-selection.md) を参照。

## データフロー

```text
CSV ファイル (File)
  │ arrayBuffer()
  ▼
decode.ts   decodeCsvBytes()     UTF-8(fatal) → 失敗時 Shift_JIS で自動判別
  │ string
  ▼
parseCsv.ts parseGradesCsv()     セクション探索・列名解決・科目行抽出・区分判定
  │ ParseResult { studentId, courses: CourseRecord[], warnings }
  ▼
judge.ts    judge()              二重区分の充当 → 単位集計 → 要件ごとの判定
  │ JudgeResult { overall, requirements, courses, warnings }
  ▼
App.tsx / components/            結果の表示のみ（ロジックを持たない）
```

## モジュール構成

```text
src/
├── main.tsx               エントリポイント
├── App.tsx                画面全体・状態管理（読み込み結果 or エラー）
├── components/
│   ├── FileDropZone.tsx   ファイル選択・ドラッグ＆ドロップ
│   ├── RequirementTable.tsx  要件別の充足状況テーブル
│   └── CourseTable.tsx    読み込んだ科目一覧テーブル
└── lib/                   ← UI 非依存の純粋ロジック（Vitest の対象）
    ├── types.ts           共有型定義
    ├── decode.ts          文字コード判別
    ├── normalize.ts       科目名の表記ゆれ正規化（ローマ数字・全角・空白）
    ├── parseCsv.ts        KOAN CSV パーサ（フォーマットは docs/csv-format.md）
    ├── rules.ts           修了要件の定数（根拠は docs/requirements.md）
    └── judge.ts           判定ロジック
```

## 設計上のポイント

- **ロジックと UI の分離**: `src/lib/` は React に依存しない純粋関数のみ。
  修了判定という間違えられない部分を単体テストで固めている。
- **要件は `rules.ts` に集約**: 規程改定や他専攻対応は原則ここ（と
  `judge.ts` の要件リスト）の変更で済む。科目区分の解釈は CSV の
  「科目詳細区分」「科目小区分」列を信頼し、科目名のハードコードは
  必修・選択必修の照合にのみ使う。
- **二重区分の充当**: 専門教育科目・高度国際性涵養教育科目の両方に属する
  科目は、規程別表1（注）のとおり涵養側の必要 1 単位を満たすまで涵養へ、
  以降は専門教育側へ科目単位で充当する（`judge.ts allocateBuckets`）。
- **判定不能項目の明示**: 研究指導の修了認定は CSV に現れないため、
  `satisfied: null`（要確認）として UI に出し、総合判定からは除外する。

## 拡張の指針

- **他専攻への対応**: `rules.ts` を専攻ごとの定義に分割し、CSV の
  学生所属コード（例: 330103）から専攻を推定して切り替える。
- **履修中科目の扱い**: 成績未確定行の表現が判明したら `parseCsv.ts` で
  「見込み単位」として別カウントし、判定を「確定」「見込み込み」の
  2 本立てにする。
