/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { viteSingleFile } from 'vite-plugin-singlefile'

// "singlefile" mode bundles everything into one HTML file for a quick shareable preview.
// The normal build (npm run build) is what Vercel uses.
export default defineConfig(({ mode }) => ({
  plugins: [react(), ...(mode === 'singlefile' ? [viteSingleFile()] : [])],
  build: mode === 'singlefile' ? { outDir: 'dist-single' } : {},
  test: { environment: 'node' },
}))
