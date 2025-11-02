import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path' // <-- THÊM DÒNG NÀY

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  
  // --- THÊM KHỐI NÀY ĐỂ CẤU HÌNH ALIAS '@' ---
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    }
  }
  // ------------------------------------------
})