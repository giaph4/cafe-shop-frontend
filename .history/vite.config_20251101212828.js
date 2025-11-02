import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path' // Quan trọng

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  
  // Thêm khối này để cấu hình alias '@'
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    }
  }
})