# 实现说明（IMPLEMENTATION）

本文件记录数据模型、技术实现与已知限制。全局视觉规范见 [DESIGN](./DESIGN.md)；页面结构、路由与交互见 [PAGE_SPEC](./PAGE_SPEC.md)；云数据库字段明细见 [字段与接口来源文档](./字段接口来源文档.md)。

## 1. 数据模型

数据默认来自本地文件，云数据库可用时整体替换为云端数据（失败自动回退本地）：

- 原型：`prototype/data.js`，挂载在 `window` 上；
- 小程序：`miniapp/src/data/anime.js`（本地兜底），`miniapp/src/cloud/`（云查询与字段映射）。
- 云数据库：`anime`（番剧主表）、`airing_schedule`（分集放送时间表）、`sync_state`（同步状态）、`match_review`（中文名审核）。
- 集合字段、接口来源与映射明细见 [字段与接口来源文档](./字段接口来源文档.md)。

```text
window.WEEK:        [{ label, md, date }] × 7   // 当前自然周，按北京时间动态生成
window.TODAY_INDEX: number                      // 今天在 WEEK 中的下标（0 = 周一）
window.ANIME:       AnimeItem[]                 // 21 部
window.SEARCH_HISTORY: string[]                 // 搜索历史初始数据
```

- 日期条按北京时间（UTC+8）生成，`md` 为真实月-日，`date` 为 `YYYY-MM-DD`；`TODAY_INDEX` 由当天星期计算，`0` 表示周一、`6` 表示周日。
- 小程序 `store.js` 以响应式 `WEEK` 保存日期条，`App.vue` 的 `onShow` 调用 `syncWeek()`，跨天后自动重建并回到今天；云端缺少 `airing_day` 时按 `next_airing_at` 的北京星期对齐。

`AnimeItem`：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | string | 唯一标识，同时对应海报文件名 |
| `day` | number | 星期下标 0~6 |
| `time` | string | 北京时间 `HH:MM` |
| `ep` / `totalEps` | number | 当前集 / 总集数 |
| `category` | `'anime' \| 'guochuang'` | 番剧 / 国创 |
| `title` / `jp` | string | 中文名 / 日文名（国创可为空） |
| `poster` | string | 原型 `assets/<id>.jpg`；小程序 `/static/<id>.jpg` |
| `tags` / `extraTags` | string[] | 主标签 / 扩展标签（详情「更多」） |
| `studio` / `season` / `status` | string | 制作 / 季度 / 放送状态 |
| `genres` | string[] | 类型（英文分类） |
| `ratings` | number[4] | MAL / Bangumi / AS / TMDB |
| `next` | object | `{ ep, total, date, countdown }` 下一集信息 |
| `synopsis` | string | 简介 |
| `platforms` | string[] | 播出平台（原型不展示，边界线内功能） |

假数据分布：共 21 部，周一 9 部、周二至周日各 2 部；番剧与国创混合。海报共 21 张，其中 10 张裁切自原型图、11 张为本地生成的风格化封面。

## 2. 实现方式

### 2.1 原型（`prototype/`）

纯静态 HTML / CSS / JS，单页 hash 路由，无构建工具、无包管理器依赖、无网络请求，可直接以 `file://` 打开。

### 2.2 小程序（`miniapp/`）

技术栈：uni-app + Vue 3 + Vite，目标平台微信小程序（`mp-weixin`），H5 仅用于本地预览。

| 原型页面 | 小程序路由 | 说明 |
| --- | --- | --- |
| 时间线 / 列表 / 网格 | `pages/index/index` | 单页内通过 `view` 状态切换三种浏览方式，共享日期与筛选 |
| 搜索 | `pages/search/search` | 独立页面，返回时保留关键词 |
| 详情 | `pages/detail/detail?id=<id>` | 独立页面，返回来源页 |

- 样式按 390 设计宽等比换算为 `rpx`（750 设计宽），移动端比例与原型一致。
- 图标由内联 SVG 路径生成 `data:image/svg+xml`，作为 `.app-ico` 背景图渲染，统一 1.5 线宽。
- 状态存放在 `src/store.js` 的 `reactive` 单例中，仅内存保存；搜索历史、当前视图与日期在页面间共享。
- 云开发：`App.vue` 启动时 `initCloud()` 初始化 `wx.cloud`，`loadAnime()` 拉取 `anime` 集合；`src/cloud/index.js` 优先调用云函数 `animeApi`（`list` / `detail` / `week`），失败后直查数据库，仍失败则保留本地假数据。
- 云函数源码位于 `miniapp/cloudfunctions/`，构建时同步到小程序产物 `cloudfunctions/`，由微信开发者工具上传部署：
  - `animeApi`：小程序端读查询（`list` / `detail` / `week`）；
  - `animeSync`：服务端同步 AniList / Bangumi / AnimeSchedule 数据到云数据库。
- 云环境 ID 通过 `.env.local` 的 `VITE_CLOUD_ENV` 注入，不写入仓库；未配置时使用默认云环境。
- 数字字体 NeutraText-DemiAlt 以 base64 `@font-face` 内嵌在 `src/styles/app.css`，确保 H5 与小程序端一致；原型使用 `assets/` 下的本地字体文件。

## 3. 已知限制

- 数据为静态假数据与云数据库双通道：云查询失败或 H5 预览时回退本地数据，刷新即重置，无持久化、无登录。
- PRD 边界内的个人追番管理、外部联动、视频与社区不实现。
- 云函数需在微信开发者工具手动上传部署；仓库不提交 AppID 与云环境 ID。
