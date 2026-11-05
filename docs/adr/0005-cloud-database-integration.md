# ADR-0005：小程序接入微信云开发数据库

- 状态：已接受
- 日期：2026-11-06
- 相关：[DESIGN](../DESIGN.md#7-数据模型) / [ADR-0004](0004-uni-app-vue3-miniapp.md)

## 背景

小程序前端此前只使用 `src/data/anime.js` 的本地假数据。云开发控制台已建立 `anime`、`airing_schedule`、`sync_state`、`match_review` 四个集合，并写入种子数据。需要让小程序读取云端数据，同时保证 H5 预览与云端异常时仍可运行。

约束：

- `mp-weixin` 运行时才有 `wx.cloud`，H5 无云能力；
- 仓库不得提交真实 AppID 与云环境 ID；
- 云函数需要在微信开发者工具中手动上传部署，构建产物需包含云函数目录。

## 决策

1. 在 `App.vue` 的 `onLaunch` 中调用 `initCloud()`，通过 `#ifdef MP-WEIXIN` 条件编译初始化 `wx.cloud`，环境 ID 由 `.env.local` 的 `VITE_CLOUD_ENV` 注入。
2. `src/store.js` 维护 `state.anime`，启动时 `loadAnime()` 拉取云端列表；成功后整体替换本地数据，失败保留本地假数据。
3. 查询顺序：云函数 `animeApi`（`list` / `detail` / `week`）→ 客户端直查 `anime` 集合（分页 20 条/次）→ 本地假数据。
4. 云函数源码放在 `miniapp/cloudfunctions/animeApi/`，`vite.config.js` 在 `mp-weixin` 构建结束时同步到 `dist/**/cloudfunctions/`，并在 `manifest.json` 声明 `cloudfunctionRoot`。
5. 云文档到 `AnimeItem` 的字段映射集中在 `src/cloud/normalize.js`（如 `title_cn → title`、`cover_image → poster`、`next_airing_at` 按北京时间格式化）。

## 后果

### 正面

- 小程序可直接读取控制台已有的种子数据，无需改页面结构；
- 云函数不可用时仍能通过数据库权限「所有用户可读」直查，开发期无需先部署云函数；
- H5 预览与离线场景自动回退本地数据，不影响现有交互验证。

### 负面 / 代价

- 数据有本地与云端两份，字段变更需同时更新 `normalize.js` 与种子数据；
- 客户端直查单次最多 20 条，需分页循环；
- 云函数部署与 AppID、云环境配置仍需本地完成，不能随仓库分发。

## 替代方案

- 方案 A：仅在页面内直接 `wx.cloud.database()` 查询。放弃：详情/周表聚合逻辑分散，后续同步写入不便。
- 方案 B：全部走云函数，不保留本地数据。放弃：H5 预览与云函数未部署时页面空白，破坏现有验证流程。
- 方案 C：引入 uniCloud。放弃：现有数据已在微信云开发控制台，迁移成本高。
