# FileChecker 文件定位

[English](README.md) | 中文

[![CI](https://github.com/nanfangtown/file-checker/actions/workflows/ci.yml/badge.svg)](https://github.com/nanfangtown/file-checker/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/filechecker.svg)](https://www.npmjs.com/package/filechecker)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

> 给 DSH 的**交付文件卡片**加一个始终可见的「打开位置」按钮。点一下就在系统文件管理器里定位该文件。

![FileChecker 在交付卡片上增加直接的“打开位置”按钮](https://raw.githubusercontent.com/nanfangtown/file-checker/main/docs/delivery-card.svg)

## 为什么

DSH 的交付文件卡片可以点开预览，但“打开文件所在位置”藏在原生打开控件的二级菜单里，不够直接。FileChecker 把它提升为一个带文字的按钮：交付的报告、图片、视频、Office 文档，一下就能跳到资源管理器 / Finder / Linux 文件管理器。

## 它做什么

在每一张 `present` 交付卡片右侧加入一个按钮：

| 状态 | 显示 | 说明 |
| --- | --- | --- |
| 空闲 | 📁 打开位置 | 点击后调用卡片自己的原生定位动作 |
| 进行中 | ◌ 打开中… | 等待 Host 桌面确认 |
| 成功 | ✓ 已定位 | 2 秒后恢复 |
| 失败 | ⚠ 打开失败 | 5 秒后恢复；悬停显示重试提示 |

- 只在 Host 明确报告“有可用桌面”时出现；没有桌面时保持隐藏，不制造死按钮。
- 点击不会触发卡片预览：事件会阻止冒泡。
- 使用 DSH 主题 token（`--dsw-alias-*`），自动适配明暗主题。
- 中英文文案随界面语言切换。

## 安装

### 从 npm 安装

```bash
dsh plugin add filechecker
```

也可以打开 DSH Web UI 的 **插件 → 添加插件**，输入 `filechecker` 安装；如果弹窗提供 **立即启用**，选择启用。

### 从本地目录安装

```bash
git clone https://github.com/nanfangtown/file-checker.git
dsh plugin add /本地绝对路径/file-checker
```

同样的本地路径也可以填进 **插件 → 添加插件**。带 HMR 的 profile 无需重启即可生效；没有 HMR 的 profile 会提示重启。

### 验证

打开任意一个已经结束、并且包含交付卡片（`present` 调用）的会话。文件右侧应当出现「打开位置」按钮；点击后系统文件管理器会打开所在目录并选中该文件。

## 为什么不需要新的文件权限

按钮调用的是交付卡片插槽自带的 `onAction('reveal')`，也就是 `ui-deliverables` 已经注册的：

```
POST /api/present.open?sessionId=…&seq=…&index=…&action=reveal
```

这条路由会重新校验 Session、交付事件、文件坐标和 Host 路径映射。FileChecker 不新增 Host 路由、不复制文件路径到页面、不读取其他插件的 DOM，因此没有扩大文件访问面。Host 半只是一个空的 `apply()`，存在的原因仅仅是让 bundle 挂载、让 Client 清单发现 `./client`。

## 兼容性

- 已在 **DSH 0.2.1-rc.2 / Windows 11** 上实测。
- 定位动作本身跨平台，走 Host 的原生文件管理器集成；插件 UI 是浏览器侧，跟随主题。
- 需要 DSH 管理型 profile。没有 Host 桌面时按钮隐藏，不会失败。
- `deliverables.file.actions` 是 `ui-deliverables` 的内部插槽契约；如果未来 DSH 改名或移除它，插件需要同步更新（届时按钮会静默消失，而不是报错）。

## 本地开发安装

本地开发时，可以直接在 **插件 → 添加插件** 中选择这个仓库目录，或执行：

```bash
dsh plugin add /本地绝对路径/file-checker
```

带 HMR 的 profile 会实时加载新 bundle；没有 HMR 的 profile 需要重启。更完整的开发流程见 [CONTRIBUTING.md](CONTRIBUTING.md)。

## 真机验证记录（2026-10-19）

1. 安装 bundle 后，渲染进程实时加载了 `filechecker/client.js`。
2. 打开一个包含多张视频交付卡片的历史会话，卡片右侧都出现了「打开位置」。
3. 点击第一张卡片的「打开位置」：系统文件资源管理器打开所在目录，按钮状态变为「已定位」。
4. 关闭资源管理器，未改动被交付的文件。
5. 离线测试 **8/8 通过**。

## 开发

没有运行时或开发依赖：

```bash
git clone https://github.com/nanfangtown/file-checker.git
cd file-checker
node --test
node --check client.js
node --check index.js
```

离线测试覆盖：manifest / patch 合法性、slot 注册、双语字典键一致、无桌面时隐藏、按钮无障碍名称、pending 状态、点击时确实请求 `reveal`、样式 effect 清理、meta 与图标可读。

贡献流程见 [CONTRIBUTING.md](CONTRIBUTING.md)，安全报告见 [SECURITY.md](SECURITY.md)，发布步骤见 [PUBLISHING.md](PUBLISHING.md)。

## 结构

```
filechecker/
├── package.json          # dsh.bundle + dsh.client（web / immediately）
├── cordis.patch.yml      # 插入 Host 行 filechecker
├── index.js              # Host 空实现：只为挂载 bundle 与发现 client
├── client.js             # 浏览器半：注册 deliverables.file.actions
├── locale/{zh,en}.json   # 插件管理器的标题与描述
├── icon.svg              # 原创插件图标
├── docs/delivery-card.svg# README 示意图
├── test/plugin.test.mjs  # 离线测试
└── README.md / README.zh.md
```

## 已知限制

- **只加在交付卡片上**：变更文件卡片（changed-files）与右侧预览头仍使用 DSH 自带控件；它们本来就有原生打开/定位入口。
- **按钮与自带控件并存**：DSH 自带的原生打开控件仍保留（图标菜单），FileChecker 只是把“定位”提升为直接按钮。
- **失败只给通用提示**：`onAction` 返回 `revealError`，不区分“文件已删除”“路径无映射”等具体原因；具体原因在 Host 侧路由里。
- **插槽名是内部契约**：按钮注册在 `ui-deliverables` 声明的 `deliverables.file.actions` 上；如果未来 DSH 改名或移除该插槽，插件需要同步更新。
- **不读取文件内容**：插件只请求定位，不读取、不复制、不上传被交付的文件。

## 许可证

[MIT](LICENSE) © nanfangtown
