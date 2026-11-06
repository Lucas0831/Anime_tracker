# 追番助手（Anime Tracker Assistant）

按星期展示正在播出的番剧：放送日期、北京时间、更新集数、作品信息。面向追番数量较多、信息分散在多个网站与 App 中的动漫爱好者。

本仓库包含两个可运行产物：`prototype/` 纯静态可点击原型（视觉与交互基线，全部使用本地假数据）与 `miniapp/` uni-app + Vue 3 小程序前端（已接入微信云开发，读取 AniList / Bangumi / AnimeSchedule 的真实番剧数据，云端不可用时回退本地种子数据）。

## 当前状态

| 项目 | 说明 |
| --- | --- |
| 版本 | v0.1.0（原型）+ 云开发迭代（Unreleased） |
| 定位 | 微信小程序（正式产品），当前以 Web 原型验证信息架构，前端已迁移到 uni-app 并接入真实数据 |
| 数据 | 云端 `anime` 集合（AniList 季度番剧 + Bangumi 中文名/评分 + AnimeSchedule 周表）；本地 21 部假数据仅作回退，原型位于 `prototype/data.js`，小程序位于 `miniapp/src/data/anime.js` |
| 最短通关路径 | ① 打开小程序，查看首页当天的番剧时间线 → ② 关闭小程序 |
| 技术栈 | 原型：纯静态 HTML/CSS/JS；小程序：uni-app + Vue 3 + Vite + 微信云开发（云函数 `animeApi` / `animeSync`） |

## 快速开始

方式一：直接双击打开 `prototype/index.html`（`file://` 协议即可运行）。

方式二：启动本地静态服务（推荐，避免个别浏览器对本地文件的限制）：

```powershell
cd prototype
python -m http.server 8765
# 浏览器访问 http://127.0.0.1:8765/
```

建议以 `390 × 844`（iPhone 尺寸）视口查看，桌面端会以 420 × 860 的手机框展示。

小程序前端：

```powershell
cd miniapp
npm install
npm run dev:h5          # H5 预览（默认 http://localhost:5173）
npm run build:mp-weixin # 产出 dist/build/mp-weixin，并自动同步云函数、注入 AppID
```

小程序依赖微信云开发，需在 `miniapp/.env.local`（不入库）中配置环境：

```text
VITE_CLOUD_ENV=你的云开发环境 ID
VITE_WECHAT_APPID=你的小程序 AppID
```

构建后使用微信开发者工具打开 `dist/build/mp-weixin`。云函数有两个：`animeApi`（查询，构建时自动同步）与 `animeSync`（同步真实数据，改动后在开发者工具中右键上传部署）。未配置云环境或云端不可用时，前端自动回退本地种子数据。

云端数据结构与接口字段对应关系见 [字段接口来源文档](docs/字段接口来源文档.md)。

## 页面与路由

原型共 5 个页面，通过 hash 路由串联；小程序用 3 个页面路由承载同样的 5 个界面。

| 页面 | 路由 | 说明 |
| --- | --- | --- |
| 时间线页 | `#/timeline` | 落地页，默认聚焦今天，按时间轴展示当天番剧 |
| 列表页 | `#/list` | 同一天的列表浏览方式 |
| 网格页 | `#/grid` | 同一天的网格浏览方式，海报封面优先 |
| 详情页 | `#/detail/<id>` | 番剧详情、下一集与标签 |
| 搜索页 | `#/search` | 按标题 / 日文名 / 标签搜索，空态展示搜索历史 |

左上角视图按钮在时间线 → 列表 → 网格之间循环切换；搜索入口在底部胶囊 Tab Bar；任意卡片进入详情，详情返回时回到来源页。顶部为「周一…周日」星期分段标签，按北京时间动态生成当前自然周并默认选中今天，点击标签或在页面上左右滑动都可切换日期。

小程序路由：`pages/index/index`（时间线 / 列表 / 网格，页内切换）、`pages/search/search`、`pages/detail/detail?id=<id>`。

## 目录结构

```text
Anime_tracker_assistant/
├── README.md                       # 项目说明与文档索引
├── CHANGELOG.md                    # 版本变更记录
├── 初版PRD.md                      # 产品需求（定位、最短路径、边界、技术栈）
├── origin_photo/                   # 四张原型参考图（不纳入版本库）
├── docs/
│   ├── DESIGN.md                   # 全局 UI 设计规范：视觉语言、色彩与材质、字体图标、尺寸动效、响应式
│   ├── PAGE_SPEC.md                # 页面与交互规格：信息架构、路由表、页面模块、交互状态
│   ├── IMPLEMENTATION.md           # 实现说明：数据模型、原型与小程序实现、已知限制
│   ├── 字段接口来源文档.md          # 云数据库集合字段与 AniList / Bangumi / AnimeSchedule 接口映射
│   └── adr/                        # 架构决策记录
│       ├── README.md               # ADR 规范与索引
│       ├── 0001-static-html-prototype.md
│       ├── 0002-local-fake-data.md
│       ├── 0003-hash-routing-spa.md
│       ├── 0004-uni-app-vue3-miniapp.md
│       ├── 0005-cloud-database-integration.md
│       ├── 0006-editorial-api-sync.md
│       └── 0007-bangumi-mirror.md
├── .trae/
│   └── rules/
│       └── project_rules.md        # 工作区规则（目录、文档、代码、提交规范）
├── prototype/                      # 纯静态原型（视觉与交互基线）
│   ├── index.html                  # 页面骨架与手机壳
│   ├── styles.css                  # 全部样式与响应式规则
│   ├── data.js                     # 假数据：WEEK / TODAY_INDEX / ANIME / SEARCH_HISTORY
│   ├── app.js                      # 路由、渲染、交互
│   └── assets/                     # 21 张海报（jpg）
└── miniapp/                        # uni-app + Vue 3 小程序前端
    ├── package.json
    ├── vite.config.js
    ├── index.html                  # H5 预览入口
    ├── scripts/postbuild-mp.js     # 构建后同步云函数、注入 AppID 与 cloudfunctionRoot
    ├── cloudfunctions/
    │   ├── animeApi/               # 查询云函数：list / detail / week
    │   └── animeSync/              # 同步云函数：season / bangumi / schedules
    └── src/
        ├── main.js / App.vue
        ├── pages.json / manifest.json
        ├── cloud/                  # wx.cloud 初始化、云函数调用、字段归一化
        ├── data/anime.js           # ES Module 假数据（云端不可用时回退）
        ├── store.js                # reactive 单例状态与筛选/搜索逻辑
        ├── icons.js                # SVG 图标路径 → data URI
        ├── components/             # AppIcon、EmptyState
        ├── styles/app.css          # rpx 样式（由原型换算）
        ├── static/                 # 21 张海报
        └── pages/                  # index / search / detail
```

## 文档索引

- [全局 UI 设计规范](docs/DESIGN.md)：设计原则、视觉语言、色彩与材质、字体图标、尺寸动效、响应式与可访问性。
- [页面与交互规格](docs/PAGE_SPEC.md)：信息架构、路由表、5 个页面的模块与交互状态、底部 Tab Bar。
- [实现说明](docs/IMPLEMENTATION.md)：数据模型、原型与小程序实现、已知限制。
- [字段接口来源文档](docs/字段接口来源文档.md)：云数据库集合字段、索引、权限与三路接口的字段映射。
- [ADR 索引](docs/adr/README.md)：静态原型选型、假数据、hash 路由、uni-app 迁移、云数据库接入、接口同步与 Bangumi 镜像。
- [变更记录](CHANGELOG.md)：按 Keep a Changelog 维护。
- [工作区规则](.trae/rules/project_rules.md)：目录职责、文档维护、代码与提交规范。

## 功能范围

已实现：

- 时间线 / 列表 / 网格三种浏览方式与循环切换
- 星期分段标签：7 个「周一…周日」文字标签 + 跟手下划线，按北京时间动态生成当前自然周并默认选中今天；左右滑动下划线实时跟手、松手按距离与速度吸附到相邻一天；点击标签时下划线与内容同步切换
- 底部胶囊式悬浮 Tab Bar 承载全部 / 番剧 / 国漫筛选与搜索入口
- 番剧详情（下一集倒计时、信息 / 工作室 / 标签）
- 搜索（标题、日文名、标签匹配；空态仅显示搜索历史；关键词保留与清空）
- 标签展开、回到顶部、各种空状态
- 微信云开发接入：`animeApi` 查询、`animeSync` 同步 AniList 季度番剧 / Bangumi 中文名与评分 / AnimeSchedule 周表，云端不可用时回退本地种子数据
- 顶栏标题与左侧切换按钮按原生胶囊位置动态对齐；详情页头图背景覆盖状态栏区域

非目标（见 PRD 边界）：

- 不做个人追番管理、提醒与外部联动、视频与社区功能
- 原型不发起任何网络请求，不写入真实用户数据

## 维护约定

任何新增页面或交互，请同步更新 `docs/PAGE_SPEC.md`；视觉规范调整同步 `docs/DESIGN.md`；数据模型或实现方式变化同步 `docs/IMPLEMENTATION.md`；以上变更均写入 `CHANGELOG.md`。涉及技术选型或结构性的决定，另写 ADR。详细规则见 [project_rules.md](.trae/rules/project_rules.md)。
