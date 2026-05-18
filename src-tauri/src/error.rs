use serde::Serialize;
use thiserror::Error;

#[derive(Debug, Error)]
pub enum AppError {
    #[error("io: {0}")]
    Io(#[from] std::io::Error),

    #[error("json: {0}")]
    Json(#[from] serde_json::Error),

    #[error("home directory not found")]
    HomeNotFound,

    #[error("factory settings file is not a JSON object")]
    SettingsNotObject,

    #[error("preset not found: {0}")]
    PresetNotFound(String),

    #[error("invalid backup filename")]
    InvalidBackupName,

    #[error("backup not found: {0}")]
    BackupNotFound(String),

    #[error("{0}")]
    Other(String),
}

impl Serialize for AppError {
    fn serialize<S: serde::Serializer>(&self, s: S) -> Result<S::Ok, S::Error> {
        s.serialize_str(&self.to_string())
    }
}

pub type AppResult<T> = std::result::Result<T, AppError>;
