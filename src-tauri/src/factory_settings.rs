use std::collections::HashSet;
use std::fs;
use std::io::Write;
use std::path::Path;

use chrono::Utc;
use serde_json::{Value, json};

use crate::error::{AppError, AppResult};
use crate::paths::{
    backups_dir, ensure_droid_switch_dirs, factory_dir, factory_settings_local_path,
    factory_settings_path, managed_factory_settings_path,
};
use crate::provider::{BackupInfo, CustomModel, FactoryMeta, Preset};

const MAX_BACKUPS: usize = 10;
const BACKUP_PREFIX: &str = "settings-";
const BACKUP_SUFFIX: &str = ".json";

pub fn read_meta() -> AppResult<FactoryMeta> {
    let settings_path = factory_settings_path()?;
    let local_path = factory_settings_local_path()?;
    if !settings_path.exists() && !local_path.exists() {
        return Ok(FactoryMeta {
            exists: false,
            active_model: None,
            custom_models_count: 0,
        });
    }

    let root = read_effective_settings()?;
    let active_model = root
        .get("sessionDefaultSettings")
        .and_then(|v| v.get("model"))
        .and_then(|v| v.as_str())
        .map(|s| s.to_string());
    let custom_models_count = root
        .get("customModels")
        .and_then(|v| v.as_array())
        .map(|a| a.len())
        .unwrap_or(0);

    Ok(FactoryMeta {
        exists: true,
        active_model,
        custom_models_count,
    })
}

pub fn read_custom_models() -> AppResult<Vec<CustomModel>> {
    let mut out = Vec::new();
    let mut seen = HashSet::new();

    for path in [factory_settings_local_path()?, factory_settings_path()?] {
        if !path.exists() {
            continue;
        }

        let root = read_json(&path)?;
        for model in custom_models_from_value(&root) {
            if seen.insert(import_dedupe_key(&model)) {
                out.push(model);
            }
        }
    }

    Ok(out)
}

pub fn apply_preset(preset: &Preset) -> AppResult<()> {
    let path = managed_factory_settings_path()?;
    let mut root = read_json_if_exists(&path)?.unwrap_or_else(|| json!({}));

    if !root.is_object() {
        return Err(AppError::SettingsNotObject);
    }

    let backup_bytes = fs::read(&path).unwrap_or_else(|_| b"{}".to_vec());
    write_backup(&backup_bytes)?;
    prune_backups(MAX_BACKUPS)?;

    root["customModels"] = json!([preset.custom_model]);

    let session = root
        .as_object_mut()
        .ok_or(AppError::SettingsNotObject)?
        .entry("sessionDefaultSettings")
        .or_insert(json!({}));
    if !session.is_object() {
        *session = json!({});
    }
    session["model"] = json!(preset.custom_model.model);

    let factory = factory_dir()?;
    if !factory.exists() {
        fs::create_dir_all(&factory)?;
    }
    atomic_write_json(&path, &root)?;
    Ok(())
}

pub fn infer_active_preset_id(presets: &[Preset]) -> AppResult<Option<String>> {
    let root = read_effective_settings()?;
    Ok(active_preset_id_from_value(&root, presets))
}

pub fn atomic_write_json(path: &Path, value: &Value) -> AppResult<()> {
    let parent = path
        .parent()
        .ok_or_else(|| AppError::Other(format!("cannot determine parent of {}", path.display())))?;
    if !parent.exists() {
        fs::create_dir_all(parent)?;
    }
    let tmp = parent.join(format!(
        ".{}.tmp.{}",
        path.file_name()
            .and_then(|s| s.to_str())
            .unwrap_or("settings"),
        std::process::id()
    ));
    {
        let mut f = fs::File::create(&tmp)?;
        let bytes = serde_json::to_vec_pretty(value)?;
        f.write_all(&bytes)?;
        f.sync_all()?;
    }
    fs::rename(&tmp, path)?;
    Ok(())
}

fn write_backup(bytes: &[u8]) -> AppResult<()> {
    ensure_droid_switch_dirs()?;
    let dir = backups_dir()?;
    let filename = format!(
        "{}{}{}",
        BACKUP_PREFIX,
        Utc::now().format("%Y%m%dT%H%M%S%3fZ"),
        BACKUP_SUFFIX
    );
    let path = dir.join(filename);
    let mut f = fs::File::create(&path)?;
    f.write_all(bytes)?;
    f.sync_all()?;
    Ok(())
}

fn prune_backups(keep: usize) -> AppResult<()> {
    let dir = backups_dir()?;
    if !dir.exists() {
        return Ok(());
    }
    let mut entries: Vec<_> = fs::read_dir(&dir)?
        .filter_map(|e| e.ok())
        .filter(|e| {
            let name = e.file_name();
            let s = name.to_string_lossy();
            s.starts_with(BACKUP_PREFIX) && s.ends_with(BACKUP_SUFFIX)
        })
        .collect();
    entries.sort_by_key(|e| e.file_name());
    while entries.len() > keep {
        let entry = entries.remove(0);
        let _ = fs::remove_file(entry.path());
    }
    Ok(())
}

pub fn list_backups() -> AppResult<Vec<BackupInfo>> {
    let dir = backups_dir()?;
    if !dir.exists() {
        return Ok(Vec::new());
    }
    let mut out = Vec::new();
    for entry in fs::read_dir(&dir)? {
        let entry = entry?;
        let name = entry.file_name().to_string_lossy().to_string();
        if !(name.starts_with(BACKUP_PREFIX) && name.ends_with(BACKUP_SUFFIX)) {
            continue;
        }
        let meta = entry.metadata()?;
        let created_at = parse_backup_timestamp(&name).unwrap_or_default();
        out.push(BackupInfo {
            filename: name,
            created_at,
            size: meta.len(),
        });
    }
    out.sort_by(|a, b| b.filename.cmp(&a.filename));
    Ok(out)
}

fn parse_backup_timestamp(name: &str) -> Option<String> {
    let stamp = name
        .strip_prefix(BACKUP_PREFIX)?
        .strip_suffix(BACKUP_SUFFIX)?;
    Some(stamp.to_string())
}

pub fn restore_backup(filename: &str) -> AppResult<()> {
    if filename.contains('/') || filename.contains('\\') || filename.contains("..") {
        return Err(AppError::InvalidBackupName);
    }
    if !(filename.starts_with(BACKUP_PREFIX) && filename.ends_with(BACKUP_SUFFIX)) {
        return Err(AppError::InvalidBackupName);
    }
    let src = backups_dir()?.join(filename);
    if !src.exists() {
        return Err(AppError::BackupNotFound(filename.to_string()));
    }
    let bytes = fs::read(&src)?;
    let value: Value = serde_json::from_slice(&bytes)?;
    let dst = managed_factory_settings_path()?;

    let current_bytes = fs::read(&dst).unwrap_or_else(|_| b"{}".to_vec());
    write_backup(&current_bytes)?;
    prune_backups(MAX_BACKUPS)?;

    let factory = factory_dir()?;
    if !factory.exists() {
        fs::create_dir_all(&factory)?;
    }
    atomic_write_json(&dst, &value)?;
    Ok(())
}

fn read_effective_settings() -> AppResult<Value> {
    let mut root = read_json_if_exists(&factory_settings_path()?)?.unwrap_or_else(|| json!({}));
    if !root.is_object() {
        return Err(AppError::SettingsNotObject);
    }

    if let Some(local_root) = read_json_if_exists(&factory_settings_local_path()?)? {
        if !local_root.is_object() {
            return Err(AppError::SettingsNotObject);
        }
        merge_json(&mut root, local_root);
    }

    Ok(root)
}

fn read_json(path: &Path) -> AppResult<Value> {
    Ok(serde_json::from_slice(&fs::read(path)?)?)
}

fn read_json_if_exists(path: &Path) -> AppResult<Option<Value>> {
    if !path.exists() {
        return Ok(None);
    }
    Ok(Some(read_json(path)?))
}

fn merge_json(base: &mut Value, overlay: Value) {
    match (base, overlay) {
        (Value::Object(base_map), Value::Object(overlay_map)) => {
            for (key, overlay_value) in overlay_map {
                match base_map.get_mut(&key) {
                    Some(base_value) => merge_json(base_value, overlay_value),
                    None => {
                        base_map.insert(key, overlay_value);
                    }
                }
            }
        }
        (base_slot, overlay_value) => *base_slot = overlay_value,
    }
}

fn custom_models_from_value(root: &Value) -> Vec<CustomModel> {
    let arr = match root.get("customModels").and_then(|v| v.as_array()) {
        Some(arr) => arr,
        None => return Vec::new(),
    };

    let mut out = Vec::with_capacity(arr.len());
    for value in arr {
        if let Ok(mut model) = serde_json::from_value::<CustomModel>(value.clone()) {
            normalize_custom_model(&mut model);
            out.push(model);
        }
    }
    out
}

fn normalize_custom_model(model: &mut CustomModel) {
    if model.display_name.trim().is_empty() {
        model.display_name = model.model.clone();
    }
}

fn import_dedupe_key(model: &CustomModel) -> String {
    format!("{}\u{0}{}", model.model, model.base_url)
}

fn active_preset_id_from_value(root: &Value, presets: &[Preset]) -> Option<String> {
    let active_model = root
        .get("sessionDefaultSettings")
        .and_then(|v| v.get("model"))
        .and_then(|v| v.as_str())?;
    let selected = custom_models_from_value(root)
        .into_iter()
        .find(|model| model.model == active_model)?;
    let mut matches = presets
        .iter()
        .filter(|preset| preset.custom_model == selected)
        .map(|preset| preset.id.clone());
    let first = matches.next()?;
    if matches.next().is_some() {
        return None;
    }
    Some(first)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn merge_json_applies_local_overrides() {
        let mut base = json!({
            "locale": "en",
            "sessionDefaultSettings": {
                "model": "base-model",
                "reasoningEffort": "medium"
            },
            "customModels": [
                { "model": "base-model" }
            ]
        });
        let local = json!({
            "sessionDefaultSettings": {
                "model": "local-model"
            },
            "customModels": [
                { "model": "local-model" }
            ]
        });

        merge_json(&mut base, local);

        assert_eq!(base["locale"], "en");
        assert_eq!(base["sessionDefaultSettings"]["model"], "local-model");
        assert_eq!(base["sessionDefaultSettings"]["reasoningEffort"], "medium");
        assert_eq!(base["customModels"][0]["model"], "local-model");
    }

    #[test]
    fn custom_models_from_value_defaults_missing_display_name() {
        let root = json!({
            "customModels": [
                {
                    "model": "gpt-5",
                    "baseUrl": "https://api.example.com/v1",
                    "apiKey": "${API_KEY}",
                    "provider": "openai"
                }
            ]
        });

        let models = custom_models_from_value(&root);

        assert_eq!(models.len(), 1);
        assert_eq!(models[0].display_name, "gpt-5");
    }

    #[test]
    fn active_preset_id_uses_effective_custom_model() {
        let root = json!({
            "customModels": [
                {
                    "model": "gpt-5",
                    "displayName": "GPT-5",
                    "baseUrl": "https://api.example.com/v1",
                    "apiKey": "${API_KEY}",
                    "provider": "openai"
                }
            ],
            "sessionDefaultSettings": {
                "model": "gpt-5"
            }
        });
        let presets = vec![Preset {
            id: "preset-1".to_string(),
            label: "My GPT-5".to_string(),
            custom_model: CustomModel {
                model: "gpt-5".to_string(),
                display_name: "GPT-5".to_string(),
                base_url: "https://api.example.com/v1".to_string(),
                api_key: "${API_KEY}".to_string(),
                provider: "openai".to_string(),
                max_output_tokens: None,
                no_image_support: None,
                extra_args: None,
                extra_headers: None,
            },
            created_at: "2026-05-18T00:00:00Z".to_string(),
            updated_at: "2026-05-18T00:00:00Z".to_string(),
        }];

        assert_eq!(
            active_preset_id_from_value(&root, &presets),
            Some("preset-1".to_string())
        );
    }
}
