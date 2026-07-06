# Dokku 用マルチステージビルド:
# ステージ1で pnpm により静的サイトをビルドし、ステージ2の nginx で配信する。
# 成果物は静的ファイルのみなので実行イメージに Node.js は含めない。

FROM node:24-alpine AS build
WORKDIR /app

# packageManager フィールドと同じバージョンを使う
RUN npm install -g pnpm@11.10.0

# 依存関係を先にインストールしてレイヤーキャッシュを効かせる
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

COPY tsconfig.json tsconfig.app.json tsconfig.node.json vite.config.ts index.html ./
COPY src ./src
RUN pnpm build

FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
