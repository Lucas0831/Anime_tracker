import { defineConfig } from 'vite'
import uni from '@dcloudio/vite-plugin-uni'
import fs from 'node:fs'
import path from 'node:path'

// 将云函数源码同步到小程序构建产物，供微信开发者工具识别 cloudfunctionRoot
function cloudfunctions() {
  return {
    name: 'copy-cloudfunctions',
    apply: 'build',
    closeBundle() {
      const platform = process.env.UNI_PLATFORM
      const outDir = process.env.UNI_OUTPUT_DIR
      if (platform !== 'mp-weixin' || !outDir) return
      const source = path.resolve(process.cwd(), 'cloudfunctions')
      if (!fs.existsSync(source)) return
      fs.cpSync(source, path.join(outDir, 'cloudfunctions'), { recursive: true })
    }
  }
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    uni(),
    cloudfunctions(),
  ],
})
