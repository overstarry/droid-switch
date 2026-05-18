use std::fs;

use chrono::Utc;

use crate::error::{AppError, AppResult};
use crate::factory_settings::{atomic_write_json, infer_active_preset_id, read_custom_models};
use crate::paths::{ensure_droid_switch_dirs, providers_path};
use crate::provider::{Preset, Store};

pub fn now_rfc3339() -> String {
    Utc::now().to_rfc3339()
}

pub fn load_store() -> AppResult<Store> {
    let mut store = load_store_file()?;
    store.active_id = infer_active_preset_id(&store.presets)?;
    Ok(store)
}

fn load_store_file() -> AppResult<Store> {
    let path = providers_path()?;
    if !path.exists() {
        return Ok(Store::default());
    }
    let bytes = fs::read(&path)?;
    if bytes.is_empty() {
        return Ok(Store::default());
    }
    let store: Store = serde_json::from_slice(&bytes)?;
    Ok(store)
}

pub fn save_store(store: &Store) -> AppResult<()> {
    ensure_droid_switch_dirs()?;
    let path = providers_path()?;
    let value = serde_json::to_value(store)?;
    atomic_write_json(&path, &value)?;
    Ok(())
}

pub fn upsert_preset(mut preset: Preset) -> AppResult<Store> {
    let mut store = load_store_file()?;
    let now = now_rfc3339();
    if preset.id.trim().is_empty() {
        preset.id = uuid::Uuid::new_v4().to_string();
        preset.created_at = now.clone();
        preset.updated_at = now;
        store.presets.push(preset);
    } else {
        let id = preset.id.clone();
        let existing = store.presets.iter_mut().find(|p| p.id == id);
        match existing {
            Some(slot) => {
                preset.created_at = slot.created_at.clone();
                preset.updated_at = now;
                *slot = preset;
            }
            None => {
                preset.created_at = now.clone();
                preset.updated_at = now;
                store.presets.push(preset);
            }
        }
    }
    save_store(&store)?;
    load_store()
}

pub fn delete_preset(id: &str) -> AppResult<Store> {
    let mut store = load_store_file()?;
    let before = store.presets.len();
    store.presets.retain(|p| p.id != id);
    if store.presets.len() == before {
        return Err(AppError::PresetNotFound(id.to_string()));
    }
    if store.active_id.as_deref() == Some(id) {
        store.active_id = None;
    }
    save_store(&store)?;
    load_store()
}

pub fn set_active(id: &str) -> AppResult<Store> {
    let mut store = load_store()?;
    if !store.presets.iter().any(|p| p.id == id) {
        return Err(AppError::PresetNotFound(id.to_string()));
    }
    store.active_id = Some(id.to_string());
    Ok(store)
}

pub fn import_from_factory() -> AppResult<Store> {
    let mut store = load_store_file()?;
    let models = read_custom_models()?;
    let now = now_rfc3339();
    let mut added = 0usize;
    for m in models {
        let dup = store
            .presets
            .iter()
            .any(|p| p.custom_model.model == m.model && p.custom_model.base_url == m.base_url);
        if dup {
            continue;
        }
        store.presets.push(Preset {
            id: uuid::Uuid::new_v4().to_string(),
            label: if m.display_name.is_empty() {
                m.model.clone()
            } else {
                m.display_name.clone()
            },
            custom_model: m,
            created_at: now.clone(),
            updated_at: now.clone(),
        });
        added += 1;
    }
    if added > 0 {
        save_store(&store)?;
    }
    load_store()
}
