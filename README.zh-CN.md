# Droid Switch

一个基于 Tauri 2 的桌面应用，用来管理 Factory CLI（`droid`）的多套供应商/模型预设，一键切换，告别手动改用户级 Factory 配置。

> 设计参考自 [farion1231/cc-switch](https://github.com/farion1231/cc-switch)。

[English](./README.md)

## 功能特性

- **预设库**——任意数量的供应商/模型配置存放在 `~/.droid-switch/providers.json`。
- **一键切换**——选中的预设写入 `~/.factory/settings.local.json`，并同步 `sessionDefaultSettings.model`，从而稳定覆盖 `settings.json`。
- **不破坏既有字段**——`settings.json` 继续作为基础层，`settings.local.json` 里其它字段则通过 `serde_json::Value` 反序列化—序列化原样保留。
- **原子写入**——临时文件 + rename，写入过程崩溃也不会留下半个 `settings.local.json`。
- **滚动备份**——`~/.droid-switch/backups/` 保留最近 10 份本地 override 快照，可在 UI 中一键回滚。
- **自动导入**——首次启动会把 `~/.factory/settings.local.json` 和 `~/.factory/settings.json` 中已有的 `customModels` 按 `model + baseUrl` 去重后导入预设池。
- **内置模板**——Anthropic / OpenAI / OpenRouter / DeepSeek / Ollama 五个常见起点，挑一个即可。
- **环境变量提示**——`apiKey` 写成 `${OPENAI_API_KEY}` 这种形式时，UI 会根据变量是否存在显示绿/红徽章。

## 环境要求

- macOS / Linux / Windows
- Node.js 18+ 和 pnpm 9+
- Rust 工具链（rustc ≥ 1.85, edition 2024）
- 安装好的 Factory CLI（`droid`，可选——不装也能跑应用，只是没有切换对象）

## 本地开发

```bash
pnpm install
pnpm tauri dev
```

## 打包

```bash
pnpm tauri build
```

产物在 `src-tauri/target/release/bundle/`。

## 切换的具体流程

点击预设的 **Switch** 时：

1. 先把当前的 `~/.factory/settings.local.json` 备份到 `~/.droid-switch/backups/settings-<时间戳>.json`（如果文件还不存在，就先快照一个 `{}`）。
2. 把 `customModels` 改写为只含被选中预设的单元素数组——`droid /model` 列表保持干净。
3. 把 `sessionDefaultSettings.model` 同步成选中模型。
4. `settings.local.json` 中其它所有字段原样保留，而 `settings.json` 继续提供基础配置层。
5. 通过 `.tmp` + rename 对 override 文件完成原子写入。

## 文件位置

| 路径 | 用途 |
| --- | --- |
| `~/.factory/settings.json` | Factory CLI 用户级基础配置 |
| `~/.factory/settings.local.json` | 由 Droid Switch 管理的高优先级用户级 override |
| `~/.droid-switch/providers.json` | 你的预设库 |
| `~/.droid-switch/backups/` | 滚动备份（最多 10 份） |


## 项目结构

```
.
├── src/                  # React + TS 前端
└── src-tauri/            # Rust 后端
    ├── src/error.rs
    ├── src/paths.rs
    ├── src/provider.rs
    ├── src/factory_settings.rs
    ├── src/store.rs
    ├── src/commands.rs
    └── src/lib.rs
```

## License

MIT
