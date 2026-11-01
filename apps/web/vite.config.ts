import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
export default defineConfig({
  plugins: [vue({ template: { compilerOptions: { isCustomElement: (tag) => (tag.startsWith('Tres') && tag !== 'TresCanvas') || tag === 'primitive' } } }), tailwindcss()],
  server: { port: 5173, strictPort: true },
  test: { environment: 'jsdom', include: ['src/**/*.test.ts'], restoreMocks: true },
})
