/**
*
* 파일명 : vite.config.ts
* 역할 : React 플러그인과 백엔드 API 프록시를 설정하는 Vite 구성 파일
* 생성일 : 2026-09-17
*
**/

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
})
