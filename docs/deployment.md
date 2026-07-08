# デプロイ（Dokku）

本アプリは [Dokku](https://dokku.com/) で運用する。リポジトリ直下の
`Dockerfile` を Dokku が自動検出し、`git push` だけでビルド・公開される。

## 構成

- **ビルド**: `node:24-alpine` 上で pnpm（`packageManager` と同じ 11.10.0）で
  `pnpm build` を実行（`Dockerfile` のステージ1）
- **配信**: `nginx:alpine` が `dist/` を配信（ステージ2）。
  実行イメージに Node.js や成績データは含まれない
- **nginx 設定**: `nginx.conf`。ハッシュ付きアセットの長期キャッシュと gzip を有効化

アプリはクライアントサイド完結なので、サーバ側に環境変数・データベース・
永続ストレージは一切不要。

## 初回セットアップ（Dokku サーバ側）

```bash
dokku apps:create gradcheck
# Dockerfile の EXPOSE 80 を HTTP 80 番へマッピング
dokku ports:set gradcheck http:80:80
```

独自ドメイン・HTTPS を使う場合:

```bash
dokku domains:set gradcheck gradcheck.example.com
sudo dokku plugin:install https://github.com/dokku/dokku-letsencrypt.git
dokku letsencrypt:set gradcheck email you@example.com
dokku letsencrypt:enable gradcheck
```

## デプロイ（ローカル側）

```bash
git remote add dokku dokku@<サーバのホスト名>:gradcheck   # 初回のみ
git push dokku main
```

push すると Dokku がイメージをビルドし、ゼロダウンタイムで切り替える。

## ロールバック・確認

```bash
dokku ps:report gradcheck      # 稼働状態の確認
dokku logs gradcheck -t        # nginx のアクセスログ
dokku ps:rebuild gradcheck     # 再ビルド
```

## ローカルでのイメージ検証

Docker が使える環境では、push 前に同じイメージを検証できる:

```bash
docker build -t gradcheck .
docker run --rm -p 8080:80 gradcheck
# http://localhost:8080 で確認
```

## 補足

- `.dockerignore` でリポジトリ直下の `*.csv`（成績データ）をビルド
  コンテキストから除外している。イメージに個人情報は入らない。
- 静的サイトなので GitHub Pages 等でも配信可能（`vite.config.ts` の
  `base: './'` によりサブパス配下でも動く）。Dokku は自前サーバでの
  運用手段として採用した（経緯は [tech-selection.md](tech-selection.md)）。

# デプロイ（GitHub Pages）

`.github/workflows/deploy-pages.yml` により、`main` への push を契機に
`pnpm build` → `dist/` を GitHub Pages へ公開する。CSV は GitHub 上に一切
アップロードされない（ビルド成果物にはアプリコードのみが含まれる）。

## 初回セットアップ（リポジトリ側）

GitHub の Settings → Pages で **Source** を `GitHub Actions` に設定する
（1度だけでよい）。設定後は `main` に push するたびに自動でデプロイされる。

手動でデプロイしたい場合は Actions タブから
`Deploy to GitHub Pages` ワークフローを `workflow_dispatch` で実行する。
