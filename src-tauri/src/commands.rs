use crate::error::AppResult;
use crate::factory_settings;
use crate::provider::{BackupInfo, FactoryMeta, Preset, Store};
use crate::store;

#[tauri::command]
pub fn list_presets() -> AppResult<Store> {
    store::load_store()
}

#[tauri::command]
pub fn upsert_preset(preset: Preset) -> AppResult<Store> {
    store::upsert_preset(preset)
}

#[tauri::command]
pub fn delete_preset(id: String) -> AppResult<Store> {
    store::delete_preset(&id)
}

#[tauri::command]
pub fn switch_to(id: String) -> AppResult<Store> {
    let s = store::load_store()?;
    let preset = s
        .presets
        .iter()
        .find(|p| p.id == id)
        .cloned()
        .ok_or_else(|| crate::error::AppError::PresetNotFound(id.clone()))?;
    factory_settings::apply_preset(&preset)?;
    store::set_active(&id)
}

#[tauri::command]
pub fn import_from_factory() -> AppResult<Store> {
    store::import_from_factory()
}

#[tauri::command]
pub fn read_factory_meta() -> AppResult<FactoryMeta> {
    factory_settings::read_meta()
}

#[tauri::command]
pub fn check_env_var(name: String) -> bool {
    std::env::var(&name).map(|v| !v.is_empty()).unwrap_or(false)
}

#[tauri::command]
pub fn list_backups() -> AppResult<Vec<BackupInfo>> {
    factory_settings::list_backups()
}

#[tauri::command]
pub fn restore_backup(filename: String) -> AppResult<()> {
    factory_settings::restore_backup(&filename)
}
