# ADR-0003：使用 hash 路由 + 集中渲染函数组织多页面

- 状态：已接受
- 日期：2026-11-05
- 相关：[PAGE_SPEC](../PAGE_SPEC.md#2-路由表)

## 背景

原型需要 5 个页面（时间线、列表、网格、详情、搜索）并且彼此可跳转，同时要满足：

- 以 `file://` 直接打开时仍能跳转（History API 的 `pushState` 在部分浏览器/本地文件协议下受限）；
- 返回时能回到来源页，搜索返回能保留关键词；
- 不引入路由库与构建工具。

## 决策

采用 **hash 路由 + 单容器集中渲染**：

- 路由形态：`#/timeline`、`#/list`、`#/grid`、`#/search`、`#/detail/<id>`；
- `location.hash` 变化触发 `hashchange`，由 `applyRoute()` 解析路由、`render()` 输出到 `#viewport`；
- `navigate(view, opts)` 负责写 hash；`goBack()` 依据 `state.returnTo` 回到来源页；
- 视图切换由 `switchView()` 循环：时间线 → 列表 → 网格 → 时间线；
- 页面内容由纯函数 `renderTimeline` / `renderList` / `renderGrid` / `renderSearch` / `renderDetail` 返回模板字符串；
- 交互统一使用 `#viewport` 上的事件委托，通过 `data-action` 分派（`open`、`back`、`day`、`filter`、`follow`、`bookmark`、`share` 等）。

## 后果

### 正面

- 在 `file://` 下也能正常跳转、刷新与回退。
- 无路由库依赖，逻辑集中在 `app.js`，便于快速调整。
- 渲染函数是纯函数，页面状态来自单一 `state` 对象，行为可预测。
- 详情/搜索的返回目标与关键词保留实现简单。

### 负面 / 代价

- hash 路由不利于 SEO，也不适合未来需要服务端渲染的场景（本项目为小程序，不受影响）。
- 每次切换整页重渲染，长列表滚动位置需手动处理（已通过 `renderKeepScroll` 保留筛选时的滚动）。
- 模板字符串缺乏组件复用，页面数量继续增长时需要拆分模块。

## 替代方案

- **多 HTML 文件 + 链接跳转**：实现直观，但 `file://` 下的相对路径、返回栈与搜索状态保留处理分散，且公共壳重复。不采用。
- **History API（`pushState`）**：URL 更干净，但本地文件协议与部分静态托管环境下存在兼容问题。原型阶段不采用。
- **引入 vue-router / 轻量路由库**：能力更完整，但违背无依赖、无构建的约束。不采用。
