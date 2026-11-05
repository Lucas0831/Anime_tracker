import { defineConfig } from 'vite'
import uni from '@dcloudio/vite-plugin-uni'

// 云函数同步与 AppID 注入见 scripts/postbuild-mp.js（构建后执行）
// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    uni(),
  ],
})
