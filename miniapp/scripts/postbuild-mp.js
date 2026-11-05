// mp-weixin 构建后处理：同步云函数、补齐本地 AppID 与 cloudfunctionRoot
const fs = require('fs');
const path = require('path');

const root = process.cwd();
const isDev = process.argv[2] === 'dev';
const outDir = path.join(root, 'dist', isDev ? 'dev/mp-weixin' : 'build/mp-weixin');

function readLocalEnv() {
  const file = path.join(root, '.env.local');
  if (!fs.existsSync(file)) return {};
  const out = {};
  fs.readFileSync(file, 'utf8').split(/\r?\n/).forEach((line) => {
    const m = line.match(/^(\w+)\s*=\s*(.*)$/);
    if (m) out[m[1]] = m[2].trim();
  });
  return out;
}

const env = readLocalEnv();

const source = path.join(root, 'cloudfunctions');
if (fs.existsSync(source) && fs.existsSync(outDir)) {
  fs.cpSync(source, path.join(outDir, 'cloudfunctions'), { recursive: true });
}

const configPath = path.join(outDir, 'project.config.json');
if (fs.existsSync(configPath)) {
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  if (env.VITE_WECHAT_APPID) config.appid = env.VITE_WECHAT_APPID;
  config.cloudfunctionRoot = 'cloudfunctions/';
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2) + '\n');
  console.log('[postbuild-mp] 已同步云函数并写入 AppID / cloudfunctionRoot');
} else {
  console.warn('[postbuild-mp] 未找到 ' + configPath);
}
