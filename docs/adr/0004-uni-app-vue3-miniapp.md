# ADR-0004：以 uni-app + Vue 3 实现小程序前端

- 状态：已接受
- 日期：2026-11-05
- 相关：[PRD](../../初版PRD.md)、[DESIGN](../DESIGN.md)

## 背景

纯静态 HTML 原型已完成信息架构、交互与视觉验证。PRD 规划的正式形态为微信小程序，技术栈为 uni-app + Vue + 云开发；需要在不破坏原型基线的前提下，产出一套可编译、可继续迭代的小程序前端。

## 决策

在仓库内新增 `miniapp/`，与 `prototype/` 并存：

- 使用 uni-app + Vue 3 + Vite，构建目标 `mp-weixin`，H5 仅用于本地预览与截图验证。
- 页面路由收敛为 3 个：`pages/index/index`（承载时间线 / 列表 / 网格三种视图）、`pages/search/search`、`pages/detail/detail`。
- 状态使用 `src/store.js` 的 `reactive` 单例，保持原型的内存态语义，不做持久化。
- 数据从 `prototype/data.js` 转为 ES Module（`src/data/anime.js`），海报复制到 `src/static/`。
- 视觉沿用原型：样式按 390 → 750 设计宽换算为 `rpx`；图标由 SVG 路径生成 data URI，作为背景图渲染。
- 自定义导航栏（`navigationStyle: "custom"`），通过 `--status-bar-height` 适配状态栏。

## 后果

### 正面

- 技术栈与 PRD 一致，可直接用 `uni build -p mp-weixin` 产出微信小程序代码。
- 与原型共用一套视觉与数据语言，后续改动可两端对照。
- 不引入真实接口与第三方 SDK，边界内功能保持不实现。

### 负面 / 代价

- 当前仅有本地假数据与内存状态，刷新或重启即重置；云开发、登录与真实数据尚未接入。
- 小程序需要自行填写 AppID 后才能真机预览；本仓库不包含密钥。
- NeutraText-DemiAlt 为商业字体，已内嵌进小程序样式；正式发布前需自行确认字体授权。

## 替代方案

- 方案 A：继续使用纯静态原型。无法产出小程序包，不满足正式形态。
- 方案 B：Taro + React。与 PRD 约定的 uni-app + Vue 不一致，迁移成本更高。
- 方案 C：拆成 5 个独立页面。视图切换会形成无意义的页面栈，返回路径复杂，不如单页内切换。
