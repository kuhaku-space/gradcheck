import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// base: './' — 任意の静的ホスティングのサブパス配下でも動くよう相対パスにする
export default defineConfig({
  base: './',
  plugins: [react()],
})
