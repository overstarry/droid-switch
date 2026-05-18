use std::path::PathBuf;

use directories::UserDirs;

use crate::error::{AppError, AppResult};

pub fn home_dir() -> AppResult<PathBuf> {
    UserDirs::new()
        .map(|d| d.home_dir().to_path_buf())
        .ok_or(AppError::HomeNotFound)
}

pub fn factory_dir() -> AppResult<PathBuf> {
    Ok(home_dir()?.join(".factory"))
}

pub fn factory_settings_path() -> AppResult<PathBuf> {
    Ok(factory_dir()?.join("settings.json"))
}

pub fn factory_settings_local_path() -> AppResult<PathBuf> {
    Ok(factory_dir()?.join("settings.local.json"))
}

pub fn managed_factory_settings_path() -> AppResult<PathBuf> {
    factory_settings_local_path()
}

pub fn droid_switch_dir() -> AppResult<PathBuf> {
    Ok(home_dir()?.join(".droid-switch"))
}

pub fn providers_path() -> AppResult<PathBuf> {
    Ok(droid_switch_dir()?.join("providers.json"))
}

pub fn backups_dir() -> AppResult<PathBuf> {
    Ok(droid_switch_dir()?.join("backups"))
}

pub fn ensure_droid_switch_dirs() -> AppResult<()> {
    let dir = droid_switch_dir()?;
    if !dir.exists() {
        std::fs::create_dir_all(&dir)?;
    }
    let backups = backups_dir()?;
    if !backups.exists() {
        std::fs::create_dir_all(&backups)?;
    }
    Ok(())
}
