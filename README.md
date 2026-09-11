# gradcheck — 修了要件チェッカー

KOAN からダウンロードした成績 CSV または SIRS の成績 TXT を読み込み、大阪大学大学院情報科学研究科
**博士前期課程（コンピュータサイエンス専攻）** の修了要件を満たしているかを
判定する Web アプリ。

- CSV は**ブラウザ内でのみ処理**され、サーバには送信されない（静的サイト）
- Shift_JIS / UTF-8 を自動判別
- SIRS TXTは2026年度公式科目表の時間割コードから区分・単位数を補完
- 要件ごとの充足状況・不足単位数・科目ごとの充当先を表示
- 学籍番号から入学年度を推定し、入学年度に応じた要件定義（ルールセット）で判定
  （2017年度以降入学に対応。典拠は研究科公式の年度別「開講科目及び修了要件表」）

> **免責**: 判定は[情報科学研究科規程 別表1](https://www.osaka-u.ac.jp/kitei/reiki_honbun/u035RG00000399.html)
> に基づく参考情報です。経過措置や専攻が個別に認める科目は反映できないため、
> 正式な修了判定は必ず教務係に確認してください。

## 使い方

1. KOAN から成績 CSV、または SIRS から成績 TXT をダウンロードする
2. アプリを開き、ファイルをドラッグ＆ドロップ（またはクリックして選択）
3. 要件別の充足状況と科目一覧が表示される

「指定科目を修得済みとして判定する」を選ぶと、CSVにない研究Ⅰa・Ⅰb、演習Ⅰ・Ⅱ、
セミナーⅠ・Ⅱ、研究Ⅱa・Ⅱbを修得済みとみなし、その単位を各単位数要件にも加える。
指定科目には必修要件の研究Ⅰa・Ⅰbと選択必修の演習Ⅰ・Ⅱも含むため、
オプション有効時は必修要件・選択必修要件も充足とする。

## 判定する要件（2019年度以降入学の場合）

| 要件 | 基準 |
|---|---|
| 必修科目 | コンピュータサイエンス研究Ⅰa・Ⅰb |
| 選択必修 | 演習Ⅰ＋Ⅱ または インタラクティブ創成工学基礎演習A（4単位） |
| 専攻基礎科目 | 22単位以上 |
| 専門教育科目 | 22単位以上 |
| 専門教育科目＋高度国際性涵養教育科目 | 28単位以上 |
| 高度国際性涵養教育科目 | 1単位以上（二重区分科目の充当規則あり） |
| 高度教養教育科目 | 2単位以上 |
| 総修得単位 | 30単位以上 |
| 研究指導 | CSV から判定不能のため「要確認」表示 |

2017〜2018年度入学は区分要件のない旧要件で判定する。

詳細な根拠・仕様は [docs/requirements.md](docs/requirements.md) を参照。

## 開発

pnpm を使用する（バージョンは `mise.toml` と `package.json` の
`packageManager` で固定）。

```bash
pnpm install
pnpm dev           # 開発サーバ (http://localhost:5173)
pnpm test          # 単体テスト (Vitest)
pnpm build         # 本番ビルド → dist/
pnpm preview       # ビルド成果物の確認
```

## デプロイ

Dokku で運用する。リポジトリ直下の `Dockerfile`（pnpm ビルド → nginx 配信の
マルチステージ）を Dokku が自動検出するため、リモートへ push するだけでよい。

```bash
git remote add dokku dokku@<サーバ>:gradcheck   # 初回のみ
git push dokku main
```

サーバ側の初回セットアップや HTTPS 化は [docs/deployment.md](docs/deployment.md) を参照。

GitHub Pages でも配信できる。`.github/workflows/deploy-pages.yml` が
`main` への push を契機にビルド・公開する（初回のみ Settings → Pages で
Source を `GitHub Actions` に設定する）。詳細は
[docs/deployment.md](docs/deployment.md#デプロイgithub-pages) を参照。

## ドキュメント

| ドキュメント | 内容 |
|---|---|
| [docs/tech-selection.md](docs/tech-selection.md) | 技術選定（要求・決定・代替案の比較） |
| [docs/requirements.md](docs/requirements.md) | 修了要件の根拠（研究科規程）と判定仕様 |
| [docs/csv-format.md](docs/csv-format.md) | KOAN 成績 CSV のフォーマット観察メモ |
| [docs/architecture.md](docs/architecture.md) | データフロー・モジュール構成・拡張指針 |
| [docs/deployment.md](docs/deployment.md) | Dokku でのデプロイ手順 |

## 技術スタック

Vite + React 19 + TypeScript / Papa Parse（CSV）/ `TextDecoder`（Shift_JIS 判別）/ Vitest（テスト）/ pnpm / Dokku（Dockerfile + nginx 配信）

選定理由は [docs/tech-selection.md](docs/tech-selection.md) にまとめている。
要点: 成績という機微データを扱うため**クライアントサイド完結**を最優先し、
判定ロジックは UI から分離した純粋関数として単体テストで担保する。
