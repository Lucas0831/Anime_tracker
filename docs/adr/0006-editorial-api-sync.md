# ADR-0006：接入 AniList / Bangumi / AnimeSchedule 同步

- 状态：已接受
- 日期：2026-11-06
- 相关：[字段与接口来源文档](../字段接口来源文档.md) / [ADR-0005](0005-cloud-database-integration.md)

## 背景

云数据库集合已建立，但数据仍是 `miniapp/src/data/anime.js` 的种子数据。需要按既定方案接入外部接口，把季度番剧、中文名与分集放送时间写入云库，供小程序读取。

约束：

- 外部接口只能从云函数访问，客户端不直连第三方，避免暴露 Token；
- Bangumi 中文名匹配可能误配，不能直接覆盖人工确认的中文名；
- AnimeSchedule v3 需要 Bearer Token，且本机联通性不稳定；
- 云函数单次执行有时间上限，大批量同步必须可分页、可分批。

## 决策

新增云函数 `animeSync`，按 `action` 拆分同步任务，统一写入云数据库：

1. `season`：AniList GraphQL `Page.media` 拉取季度列表，写入 `anime`，`_id = anilist_<id>`；首次执行默认隐藏 `seed_*` 种子数据。
2. `schedules`：AniList `Page.airingSchedules` 按时间区间拉取分集，写入 `airing_schedule`，`_id = <anime_id>_ep<集号>`。
3. `bangumi`：Bangumi v0 搜索 + 详情，标题相似度 ≥ 0.86 时写入 `bgm_id`、中文名、简介与评分；低于阈值写入 `match_review`，并把 `match_status` 置为 `review`。
4. `animeschedule`：按 ISO 年/周拉取时间表，匹配 `as_slug` 或标题后更新分集时间与延期状态；Token 缺失时该任务失败但不影响其他任务。
5. 每次执行写入 `sync_state`，记录参数、游标、统计与错误。
6. AniList 与 Bangumi 使用 Node 内置 `https` 请求，不新增运行时依赖；服务端 SDK 直接写 Date 与数组字段。

## 后果

### 正面

- 接口调用集中在云函数，客户端只读云库，第三方 Token 不下发；
- 分页 / 分批设计避免超时，可重复执行且保留 Bangumi 已补充字段；
- 低置信度匹配进入人工审核，避免中文名被误覆盖。

### 负面 / 代价

- Bangumi 搜索存在限流与网络波动，需要控制请求间隔；
- AnimeSchedule 的 Token 与 TLS 联通性需在云函数环境单独验证；
- 重跑 `season` 会覆盖 AniList 字段，仅保留 `bgm_id`、中文名、Bangumi 评分等少数字段。

## 替代方案

- 方案 A：客户端直接请求第三方接口。放弃：暴露 Token、受小程序域名白名单限制、无法写库。
- 方案 B：本地脚本离线同步后导入控制台。放弃：控制台导入不可用且无法定时执行。
- 方案 C：只接 AniList，不做 Bangumi。放弃：缺少中文名与中文简介，不符合产品目标。
