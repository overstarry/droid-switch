# Droid Switch

A Tauri 2 desktop app for managing multiple Factory CLI (`droid`) provider/model presets and switching between them with one click — no more hand-editing your user-level Factory settings.

> Inspired by [farion1231/cc-switch](https://github.com/farion1231/cc-switch).

[简体中文](./README.zh-CN.md)

## Features

- **Preset library** — keep an unlimited number of provider/model configs in `~/.droid-switch/providers.json`.
- **One-click switch** — writes the selected preset into `~/.factory/settings.local.json` and syncs `sessionDefaultSettings.model`, so it cleanly overrides `settings.json`.
- **Non-destructive** — `settings.json` remains the base layer, while all other fields in `settings.local.json` are preserved through a `serde_json::Value` round-trip.
- **Atomic writes** — temp file + rename, so a crash mid-write never leaves a half-baked `settings.local.json`.
- **Rolling backups** — last 10 versions of the managed local override are kept in `~/.droid-switch/backups/`, restorable from the UI.
- **Import existing** — first launch imports `customModels` found in both `~/.factory/settings.local.json` and `~/.factory/settings.json` (deduped by `model + baseUrl`).
- **Templates** — built-in starters for Anthropic, OpenAI, OpenRouter, DeepSeek, and Ollama.
- **Env var indicators** — API keys written as `${OPENAI_API_KEY}` show a green/red badge based on whether the variable is set.

## Requirements

- macOS / Linux / Windows
- Node.js 18+ and pnpm 9+
- Rust toolchain (rustc ≥ 1.85, edition 2024)
- A working Factory CLI install (`droid`) — optional, but the whole point.

## Develop

```bash
pnpm install
pnpm tauri dev
```

## Build

```bash
pnpm tauri build
```

Bundles land in `src-tauri/target/release/bundle/`.

## How switching works

When you click **Switch** on a preset:

1. The current `~/.factory/settings.local.json` is copied to `~/.droid-switch/backups/settings-<timestamp>.json` (or `{}` is snapshotted if the file does not exist yet).
2. `customModels` is rewritten to a single-element array containing only the selected preset — keeping `droid /model`'s list clean.
3. `sessionDefaultSettings.model` is updated to match.
4. Everything else in `settings.local.json` is preserved verbatim, and `settings.json` continues to supply the base settings layer.
5. The override file is written atomically (`.tmp` + rename).

## File locations

| Path | Purpose |
| --- | --- |
| `~/.factory/settings.json` | Factory CLI base user settings |
| `~/.factory/settings.local.json` | High-priority user override managed by Droid Switch |
| `~/.droid-switch/providers.json` | Your preset library |
| `~/.droid-switch/backups/` | Rolling backups (max 10) |


## Project layout

```
.
├── src/                  # React + TS frontend
└── src-tauri/            # Rust backend
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
